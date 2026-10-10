import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { queryClient } from '../services/react-query';
import { fetchDogDeletionProposal } from '../services/dog-ownership';
import { ModeProvider } from '../context/ModeContext';
import DogOwnership from './DogOwnership';

const state = vi.hoisted(() => ({ role: 'PRIMARY_OWNER' as string | null }));
vi.mock('../context/UserContext', async () => {
  const { createContext } = await import('react');
  return { UserContext: createContext({ userId: 'viewer' }) };
});
vi.mock('../context/NotificationContext', () => ({
  useNotification: () => ({ notify: vi.fn() }),
}));
vi.mock('../context/ConfirmModalContext', () => ({
  useConfirm: () => ({ showModal: vi.fn() }),
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../hooks/api/useFetchFriends', () => ({
  useFetchFriends: () => ({
    friends: [{ id: 'friend', name: 'Friend' }],
    isLoadingFriends: false,
  }),
}));
vi.mock('../components/dog/DeleteDogModal', () => ({
  DeleteDogModal: () => null,
}));
vi.mock('./OwnershipAction', () => ({
  OwnershipAction: () => <p>Inline invitation</p>,
}));
vi.mock('../services/dogs', () => ({
  fetchDogPage: async () => ({
    dog: { id: 'dog', name: 'Milo' },
    viewer: { is_owner: !!state.role, role: state.role },
    capabilities: {
      enabled: true,
      is_owner: !!state.role,
      role: state.role,
      can_invite: state.role === 'PRIMARY_OWNER',
      active_owner_count: 2,
    },
    members: state.role
      ? [
          {
            id: 'member',
            user_id: 'viewer',
            user_name: 'Actual name',
            role: state.role,
          },
        ]
      : [],
  }),
}));
vi.mock('../services/dog-ownership', () => ({
  fetchDogInvites: async () => [
    { id: 'declined', invitee_user_id: 'friend', status: 'DECLINED' },
    { id: 'pending', invitee_user_id: 'viewer', status: 'PENDING' },
  ],
  fetchPendingDogOwnershipRequests: async () => [],
  fetchPendingPrimaryTransfers: async () => [],
  fetchDogDeletionProposal: vi.fn(async () => null),
  cancelDogInvite: vi.fn(),
  cancelPrimaryTransfer: vi.fn(),
  createDogInvite: vi.fn(),
  createPrimaryTransfer: vi.fn(),
  proposeDogDeletion: vi.fn(),
}));

beforeEach(() => {
  state.role = 'PRIMARY_OWNER';
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.clearAllMocks();
});
const renderTab = () =>
  render(
    <ModeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dogs/dog/ownership']}>
          <Routes>
            <Route path="/dogs/:dogId/ownership" element={<DogOwnership />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ModeProvider>,
  );

// A previous account's capabilities must never enable an owner-only RPC.
it('ignores another account’s cached ownership permissions for an invitee', async () => {
  state.role = null;
  queryClient.setQueryData(['dogPage', 'dog', 'previous-owner'], {
    viewer: { is_owner: true },
    capabilities: {
      enabled: true,
      is_owner: true,
      role: 'PRIMARY_OWNER',
      active_owner_count: 2,
    },
  });
  renderTab();
  await screen.findByText('Inline invitation');
  expect(fetchDogDeletionProposal).not.toHaveBeenCalled();
  expect(screen.queryByText('dogOwnership.ownersTitle')).toBeNull();
  expect(screen.queryByText('dogOwnership.declinedInvites')).toBeNull();
});

it('shows declined history and invite again only to the primary owner', async () => {
  renderTab();
  await screen.findByRole('button', { name: 'dogOwnership.inviteAgain' });
  expect(
    screen.getByRole('link', { name: 'dogOwnership.me' }).getAttribute('href'),
  ).toBe('/profile/viewer');
  const title = screen.getByRole('heading', {
    name: 'dogOwnership.ownersTitle',
  });
  expect(title.parentElement?.querySelector('button')?.textContent).toContain(
    'dogOwnership.inviteTitle',
  );
  await waitFor(() => expect(fetchDogDeletionProposal).toHaveBeenCalledOnce());
});

it('hides other invitations and declined history from co-owners', async () => {
  state.role = 'CO_OWNER';
  renderTab();
  await screen.findByRole('link', { name: 'dogOwnership.me' });
  expect(screen.queryByText('dogOwnership.declinedInvites')).toBeNull();
  expect(screen.queryByText('dogOwnership.pendingInvites')).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'dogOwnership.inviteTitle' }),
  ).toBeNull();
});
