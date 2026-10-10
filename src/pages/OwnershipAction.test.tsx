import {
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
  fetchDogOwnershipAction,
  respondToDogInvite,
} from '../services/dog-ownership';
import { ModeProvider } from '../context/ModeContext';
import OwnershipAction from './OwnershipAction';

vi.mock('../context/UserContext', async () => {
  const { createContext } = await import('react');
  return { UserContext: createContext({ userId: 'recipient' }) };
});
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../services/dog-ownership', () => ({
  fetchDogOwnershipAction: vi.fn(),
  respondToDogInvite: vi.fn(),
  respondToDogOwnershipRequest: vi.fn(),
  respondToPrimaryTransfer: vi.fn(),
}));
vi.mock('../services/dogs', () => ({
  fetchDogPage: vi.fn(async () => ({
    dog: { name: 'Milo' },
    capabilities: { enabled: true },
  })),
}));

beforeEach(() => {
  vi.mocked(fetchDogOwnershipAction).mockResolvedValue({
    id: 'invitation',
    dog_id: 'dog',
    status: 'PENDING',
    expires_at: '',
    invitee_user_id: 'recipient',
    primary_user_id_at_creation: 'primary',
  });
});
afterEach(() => {
  cleanup();
  queryClient.clear();
  vi.resetAllMocks();
});

const renderInvitation = () =>
  render(
    <ModeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/ownership-actions/invite/invitation']}>
          <Routes>
            <Route
              path="/ownership-actions/:actionType/:actionId"
              element={<OwnershipAction />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ModeProvider>,
  );

// A slow refresh must not expose a second decision after the RPC has succeeded.
it.each([true, false])(
  'settles the invitation immediately while cache refresh is pending (approve=%s)',
  async (approve) => {
    renderInvitation();
    await screen.findByRole('checkbox');
    fireEvent.click(screen.getByRole('checkbox'));
    vi.mocked(fetchDogOwnershipAction).mockImplementation(
      () => new Promise(() => {}),
    );
    const outcome = approve ? 'ACCEPTED' : 'DECLINED';
    vi.mocked(respondToDogInvite).mockResolvedValue({ outcome });
    fireEvent.click(
      screen.getByRole('button', {
        name: approve ? 'dogOwnership.approve' : 'dogOwnership.decline',
      }),
    );
    await screen.findByText(`dogOwnership.outcomes.${outcome}`);
    expect(
      screen.queryByRole('button', { name: 'dogOwnership.approve' }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'dogOwnership.decline' }),
    ).toBeNull();
    expect(
      screen.getAllByRole('link', { name: 'dogOwnership.back' }),
    ).toHaveLength(2);
  },
);

it('keeps a failed invitation response retryable without losing disclosure consent', async () => {
  renderInvitation();
  await screen.findByRole('checkbox');
  fireEvent.click(screen.getByRole('checkbox'));
  vi.mocked(respondToDogInvite).mockRejectedValueOnce(new Error('Offline'));
  fireEvent.click(screen.getByRole('button', { name: 'dogOwnership.approve' }));
  await screen.findByRole('alert');
  await waitFor(() =>
    expect(
      screen
        .getByRole('button', { name: 'dogOwnership.approve' })
        .hasAttribute('disabled'),
    ).toBe(false),
  );
  expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
});
