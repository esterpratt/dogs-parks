import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { queryClient } from '../services/react-query';
import {
  cancelDogInvite,
  fetchDogDeletionProposal,
} from '../services/dog-ownership';
import { ModeProvider } from '../context/ModeContext';
import DogOwnership from './DogOwnership';

const state = vi.hoisted(() => ({
  role: 'PRIMARY_OWNER' as string | null,
  reinvited: false,
  pendingRequest: false,
  noInvitation: false,
  showModal: vi.fn(),
}));
vi.mock('../context/UserContext', async () => {
  const { createContext } = await import('react');
  return { UserContext: createContext({ userId: 'viewer' }) };
});
vi.mock('../context/NotificationContext', () => ({
  useNotification: () => ({ notify: vi.fn() }),
}));
vi.mock('../context/ConfirmModalContext', () => ({
  useConfirm: () => ({ showModal: state.showModal }),
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
    {
      id: 'pending',
      invitee_user_id: state.reinvited ? 'friend' : 'viewer',
      status: state.noInvitation ? 'EXPIRED' : 'PENDING',
    },
  ],
  fetchPendingDogOwnershipRequests: async () =>
    state.pendingRequest
      ? [{ id: 'new-request', requester_user_id: 'viewer', status: 'PENDING' }]
      : [],
  fetchPendingPrimaryTransfers: async () => [],
  fetchDogDeletionProposal: vi.fn(async () => null),
  cancelDogInvite: vi.fn(async () => ({ outcome: 'CANCELED' })),
  cancelPrimaryTransfer: vi.fn(),
  createDogInvite: vi.fn(),
  createPrimaryTransfer: vi.fn(),
  proposeDogDeletion: vi.fn(),
}));

beforeEach(() => {
  state.role = 'PRIMARY_OWNER';
  state.reinvited = false;
  state.pendingRequest = false;
  state.noInvitation = false;
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.clearAllMocks();
});
const renderTab = (url = '/dogs/dog/ownership') =>
  render(
    <ModeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[url]}>
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
  expect(screen.queryByText('dogOwnership.supportHelp')).toBeNull();
  expect(screen.queryByText('dogOwnership.declinedInvites')).toBeNull();
});

it('omits declined history and keeps the add-owner action in the header', async () => {
  renderTab();
  await screen.findByRole('button', { name: 'dogOwnership.inviteTitle' });
  expect(screen.queryByText('dogOwnership.declinedInvites')).toBeNull();
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
  expect(screen.getByText('dogOwnership.supportHelp')).toBeTruthy();
  expect(
    screen.getByRole('link', { name: 'esterpratt@gmail.com' }).getAttribute('href'),
  ).toBe('mailto:esterpratt@gmail.com');
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

// A new pending invitation supersedes the old decline in the administrative list.
it('hides a declined invitation while a new invitation to that person is pending', async () => {
  state.reinvited = true;
  renderTab();
  await screen.findByRole('button', { name: 'dogOwnership.revokeInvitation' });
  expect(
    screen.queryByRole('heading', { name: 'dogOwnership.declinedInvites' }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'dogOwnership.inviteAgain' }),
  ).toBeNull();
});

// Former participants keep a useful receipt without gaining owner-only details.
it('shows a completed notification receipt on the ownership tab to a non-owner', async () => {
  state.role = null;
  state.noInvitation = true;
  renderTab('/dogs/dog/ownership?status=EXPIRED&action=invite');
  await screen.findByText('dogOwnership.receipt.EXPIRED');
  expect(screen.queryByText('dogOwnership.ownersTitle')).toBeNull();
  expect(fetchDogDeletionProposal).not.toHaveBeenCalled();
});

// A notification about an earlier withdrawal must not compete with a new request.
it('shows only the current request after an earlier request was withdrawn', async () => {
  state.role = null;
  state.pendingRequest = true;
  state.noInvitation = true;
  renderTab('/dogs/dog/ownership?status=CANCELED&action=request');
  await screen.findByText('dogOwnership.requestPending');
  expect(screen.queryByText('dogOwnership.receipt.CANCELED')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'dogOwnership.cancelRequest' }),
  ).toBeTruthy();
});

// Revocation requires an explicit confirmation before invoking the RPC.
it('waits for confirmation before revoking an invitation', async () => {
  state.reinvited = true;
  renderTab();
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'dogOwnership.revokeInvitation',
    }),
  );
  expect(cancelDogInvite).not.toHaveBeenCalled();
  expect(state.showModal).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'dogOwnership.revokeInvitationConfirm',
      confirmText: 'dogOwnership.revokeShort',
    }),
  );
  await act(async () => state.showModal.mock.calls[0][0].onConfirm());
  expect(vi.mocked(cancelDogInvite).mock.calls[0][0]).toBe('pending');
});
