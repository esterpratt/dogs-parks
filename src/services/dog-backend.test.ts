import { beforeEach, expect, it, vi } from 'vitest';

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('./supabase-client', () => ({ supabase: { from } }));

beforeEach(() => {
  vi.resetModules();
  from.mockReset();
});

const setProbeResult = (error: { code: string } | null) => {
  from.mockReturnValue({
    select: () => ({ limit: async () => ({ error }) }),
  });
};

// Production's old schema reports 42P01; the adapter must select old calls
// before the missing ownership RPC can fail a signed-in profile load.
it('uses the legacy dog API when the ownership table is absent', async () => {
  setProbeResult({ code: '42P01' });
  const { usesLegacyDogBackend } = await import('./dog-backend');

  await expect(usesLegacyDogBackend()).resolves.toBe(true);
  await expect(usesLegacyDogBackend()).resolves.toBe(true);
  expect(from).toHaveBeenCalledTimes(1);
});

it('keeps the modern dog API when the table exists but is not public', async () => {
  setProbeResult({ code: '42501' });
  const { usesLegacyDogBackend } = await import('./dog-backend');

  await expect(usesLegacyDogBackend()).resolves.toBe(false);
});

it('retries a transient probe failure instead of guessing an API version', async () => {
  from
    .mockReturnValueOnce({
      select: () => ({ limit: async () => ({ error: { code: '' } }) }),
    })
    .mockReturnValueOnce({
      select: () => ({ limit: async () => ({ error: { code: '42P01' } }) }),
    });
  const { usesLegacyDogBackend } = await import('./dog-backend');

  await expect(usesLegacyDogBackend()).rejects.toEqual({ code: '' });
  await expect(usesLegacyDogBackend()).resolves.toBe(true);
});
