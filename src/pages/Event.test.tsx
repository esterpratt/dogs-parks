import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ModeProvider } from '../context/ModeContext';
import Event from './Event';

const { mockedFetchEvent } = vi.hoisted(() => ({ mockedFetchEvent: vi.fn() }));

vi.mock('../context/UserContext', async () => {
  const { createContext } = await import('react');
  return { UserContext: createContext({ userId: 'viewer' }) };
});
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../services/events', () => ({
  fetchEvent: mockedFetchEvent,
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

beforeEach(() => {
  mockedFetchEvent.mockReset();
  // Cancellation keeps the event record available to its participants.
  mockedFetchEvent.mockResolvedValue({
    event: {
      id: 'canceled-event',
      park_id: 'park',
      creator_id: 'viewer',
      status: 'CANCELED',
    },
    invitees: [],
  });
});

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

it('shows an unavailable page with a Notifications link for a deleted event', async () => {
  mockedFetchEvent.mockResolvedValue(null);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <ModeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/events/deleted-event']}>
          <Routes>
            <Route path="/events/:eventId" element={<Event />} />
            <Route path="/notifications" element={<p>Notifications loaded</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </ModeProvider>,
  );

  expect(await screen.findByText('notifications.unavailable.title')).toBeTruthy();
  expect(screen.getByText('notifications.unavailable.eventDescription')).toBeTruthy();
  const link = screen.getByRole('link', { name: 'notifications.title' });
  expect(link.getAttribute('href')).toBe('/notifications');
});
