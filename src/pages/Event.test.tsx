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
  // Cancellation keeps the event record available to its participants.
  fetchEvent: vi.fn(async () => ({
    event: {
      id: 'canceled-event',
      park_id: 'park',
      creator_id: 'viewer',
      status: 'CANCELED',
    },
    invitees: [],
  })),
}));
vi.mock('../services/parks', () => ({
  fetchParkPrimaryImage: vi.fn(async () => null),
  fetchParkWithTranslation: vi.fn(async () => ({ id: 'park', name: 'Park' })),
}));
vi.mock('../hooks/useAppLocale', () => ({
  useAppLocale: () => 'en',
}));
vi.mock('../components/event/OrganizerEvent', () => ({
  OrganizerEvent: ({ event }: { event: { status: string } }) => (
    <p>Event status: {event.status}</p>
  ),
}));

afterEach(() => cleanup());

it('opens a canceled event from its original route', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <ModeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/events/canceled-event']}>
          <Routes>
            <Route path="/events/:eventId" element={<Event />} />
            <Route path="/profile/:userId/dogs" element={<p>Pack route loaded</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ModeProvider>,
  );

  expect(await screen.findByText('Event status: CANCELED')).toBeTruthy();
  expect(screen.queryByText('Pack route loaded')).toBeNull();
});
