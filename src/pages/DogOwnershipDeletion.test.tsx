import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ModeProvider } from '../context/ModeContext';
import DogOwnershipDeletion from './DogOwnershipDeletion';

const state = vi.hoisted(() => ({
  proposal: null as null | {
    id: string;
    dog_id: string;
    consents: [];
    status: string;
  },
}));

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
vi.mock('../services/dog-ownership', () => ({
  fetchDogDeletionProposal: async () => state.proposal,
  cancelDogDeletion: vi.fn(),
  respondToDogDeletion: vi.fn(),
  withdrawDogDeletionApproval: vi.fn(),
}));
vi.mock('../services/dogs', () => ({
  fetchDogPage: async () => null,
}));

afterEach(() => {
  cleanup();
  state.proposal = null;
});

function renderDeletion() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <ModeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/ownership-actions/deletion/old-proposal']}>
          <Routes>
            <Route
              path="/ownership-actions/deletion/:proposalId"
              element={<DogOwnershipDeletion />}
            />
            <Route path="/profile/:userId/dogs" element={<p>Pack route loaded</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ModeProvider>,
  );
}

it('explains when an old deletion proposal is unavailable', async () => {
  renderDeletion();
  expect(await screen.findByText('notifications.unavailable.title')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'userDogs.titleMyPack' })).toBeTruthy();
  expect(screen.queryByText('Pack route loaded')).toBeNull();
});

it('explains when the proposal outlives its dog', async () => {
  state.proposal = {
    id: 'old-proposal',
    dog_id: 'deleted-dog',
    consents: [],
    status: 'CANCELED',
  };
  renderDeletion();
  expect(await screen.findByText('notifications.unavailable.title')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'userDogs.titleMyPack' })).toBeTruthy();
  expect(screen.queryByText('Pack route loaded')).toBeNull();
});
