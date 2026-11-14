import { cleanup, render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { queryClient } from '../../services/react-query';
import {
  NotificationTargetType,
  NotificationType,
  type Notification,
} from '../../types/notification';
import { NotificationItem } from './NotificationItem';

vi.mock('../../context/UserContext', async () => {
  const { createContext } = await import('react');
  return { UserContext: createContext({ userId: 'viewer' }) };
});
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../../hooks/useDateUtils', () => ({
  useDateUtils: () => ({ getFormattedPastDate: () => 'today' }),
}));
vi.mock('../../utils/translateNotification', () => ({
  translateNotification: () => ({
    title: 'Dog deleted',
    appMessage: 'The dog was deleted',
  }),
}));

afterEach(() => {
  cleanup();
  queryClient.clear();
});

it('keeps a completed-deletion notification visible without making it clickable', () => {
  const notification: Notification = {
    id: 'completed',
    type: NotificationType.DOG_DELETION_COMPLETED,
    target_type: NotificationTargetType.DOG,
    target_id: 'deleted-dog',
    sender_id: 'sender',
    receiver_id: 'viewer',
    title: 'Dog deleted',
    app_message: 'The dog was deleted',
    push_message: null,
    read_at: null,
    seen_at: null,
    created_at: '2026-11-14T08:00:00Z',
  };

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NotificationItem notification={notification} />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('Dog deleted')).toBeTruthy();
});
