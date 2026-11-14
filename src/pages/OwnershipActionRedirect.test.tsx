import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ModeProvider } from '../context/ModeContext';
import OwnershipActionRedirect from './OwnershipActionRedirect';

vi.mock('../context/UserContext', async () => {
  const { createContext } = await import('react');
  return { UserContext: createContext({ userId: 'viewer' }) };
});
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../services/dog-ownership', () => ({
  fetchDogOwnershipAction: async () => null,
}));
vi.mock('../services/dogs', () => ({
  fetchDogPage: vi.fn(),
}));

afterEach(() => cleanup());

it('uses the shared unavailable page for an old ownership action', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <ModeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/ownership-actions/invite/old-action']}>
          <Routes>
            <Route
              path="/ownership-actions/:actionType/:actionId"
              element={<OwnershipActionRedirect />}
            />
            <Route path="/profile/:userId/dogs" element={<p>Pack route loaded</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ModeProvider>,
  );

  expect(await screen.findByText('notifications.unavailable.title')).toBeTruthy();
  expect(screen.getByText('notifications.unavailable.description')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'userDogs.titleMyPack' })).toBeTruthy();
  expect(screen.queryByText('Pack route loaded')).toBeNull();
});
