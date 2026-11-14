import { beforeEach, expect, it, vi } from 'vitest';
import { fetchEvent } from './events';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('./supabase-client', () => ({ supabase: { rpc } }));
vi.mock('./error', () => ({
  throwError: (error: unknown) => {
    throw error;
  },
}));

beforeEach(() => {
  rpc.mockReset();
});

// Production returns 42501 before its missing-event branch; both known codes
// should become the page's unavailable state while unrelated failures surface.
it.each(['42501', 'P0002'])(
  'treats event lookup error %s as an unavailable event',
  async (code) => {
    rpc.mockResolvedValue({
      data: null,
      error: { code, message: code === '42501' ? 'insufficient_privilege' : 'event_not_found' },
    });

    await expect(fetchEvent('old-event')).resolves.toBeNull();
  },
);

it('preserves an unexpected event lookup error', async () => {
  const error = { code: '08006' };
  rpc.mockResolvedValue({ data: null, error });

  await expect(fetchEvent('old-event')).rejects.toBe(error);
});

it('does not hide an unrelated permission error', async () => {
  const error = { code: '42501', message: 'permission denied for function' };
  rpc.mockResolvedValue({ data: null, error });

  await expect(fetchEvent('old-event')).rejects.toBe(error);
});
