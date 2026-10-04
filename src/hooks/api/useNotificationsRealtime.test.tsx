import { act, renderHook, waitFor, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { queryClient } from '../../services/react-query';
import { NotificationType } from '../../types/notification';
import { useNotificationsRealtime } from './useNotificationsRealtime';

const realtime = vi.hoisted(() => ({
  insert: undefined as
    | undefined
    | ((payload: { new: Record<string, unknown> }) => void),
}));

vi.mock('../../context/UserContext', async () => {
  const { createContext } = await import('react');
  return { UserContext: createContext({ userId: 'owner' }) };
});

vi.mock('../../services/supabase-client', () => {
  const channel = {
    state: 'joined',
    on: vi.fn((_event, _filter, callback) => {
      realtime.insert = callback;
      return channel;
    }),
    subscribe: vi.fn((callback) => {
      callback('SUBSCRIBED');
      return channel;
    }),
  };
  return {
    supabase: {
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
      realtime: { setAuth: vi.fn() },
      auth: {
        getSession: vi.fn(async () => ({
          data: { session: { access_token: 'local-test-token' } },
        })),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
    },
  };
});

afterEach(() => {
  cleanup();
  queryClient.clear();
});

it('refreshes cached dog authority when another session changes the primary owner', async () => {
  // Ownership controls must react to the notification arriving, without waiting
  // for the recipient to open or click their notifications list.
  renderHook(() => useNotificationsRealtime());
  await waitFor(() => expect(realtime.insert).toBeDefined());
  queryClient.setQueryData(['dogPage', 'shared-dog'], { role: 'CO_OWNER' });
  queryClient.setQueryData(['userDogs', 'owner'], ['shared-dog']);
  queryClient.setQueryData(
    ['dogOwnershipActions', 'shared-dog', 'transfers'],
    [],
  );
  act(() =>
    realtime.insert?.({
      new: {
        id: 'notification',
        receiver_id: 'owner',
        target_id: 'shared-dog',
        type: NotificationType.DOG_PRIMARY_CHANGED,
      },
    }),
  );
  expect(
    queryClient.getQueryState(['dogPage', 'shared-dog'])?.isInvalidated,
  ).toBe(true);
  expect(queryClient.getQueryState(['userDogs', 'owner'])?.isInvalidated).toBe(
    true,
  );
  expect(
    queryClient.getQueryState([
      'dogOwnershipActions',
      'shared-dog',
      'transfers',
    ])?.isInvalidated,
  ).toBe(true);
});
