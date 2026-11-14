import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ModeProvider } from '../context/ModeContext';
import Event from './Event';

vi.mock('../context/UserContext', async () => {
  const { createContext } = await import('react');
  return { UserContext: createContext({ userId: 'viewer' }) };
});
vi.mock('../services/events', () => ({
  fetchEvent: vi.fn(async () => null),
}));
vi.mock('../services/parks', () => ({
  fetchParkPrimaryImage: vi.fn(),
  fetchParkWithTranslation: vi.fn(),
}));
vi.mock('../hooks/useAppLocale', () => ({
  useAppLocale: () => 'en',
}));

afterEach(() => cleanup());

it('returns to My Pack when an old event notification has no event', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <ModeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/events/deleted-event']}>
          <Routes>
            <Route path="/events/:eventId" element={<Event />} />
            <Route path="/profile/:userId/dogs" element={<p>My Pack</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ModeProvider>,
  );

  expect(await screen.findByText('My Pack')).toBeTruthy();
});
