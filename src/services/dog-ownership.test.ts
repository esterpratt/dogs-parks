import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { afterEach, expect, it, vi } from 'vitest';
import { getClientCompatibility } from './dog-ownership';

vi.mock('@capacitor/app', () => ({
  App: { getInfo: vi.fn() },
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

// Native compatibility must reflect the installed binary, not a fixed protocol build.
it.each([
  ['ios', 'IOS', '42'],
  ['android', 'ANDROID', '77'],
] as const)('uses the installed %s build', async (platform, expected, build) => {
  vi.spyOn(Capacitor, 'getPlatform').mockReturnValue(platform);
  vi.mocked(App.getInfo).mockResolvedValue({
    build,
    id: 'test.app',
    name: 'Test',
    version: '1.0.0',
  });

  await expect(getClientCompatibility()).resolves.toEqual({
    p_client_build: Number(build),
    p_client_platform: expected,
  });
});

it('keeps the explicit web build without calling a native plugin', async () => {
  vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('web');

  await expect(getClientCompatibility()).resolves.toEqual({
    p_client_build: 1,
    p_client_platform: 'WEB',
  });
  expect(App.getInfo).not.toHaveBeenCalled();
});

it('rejects an invalid native build before sending a capability request', async () => {
  vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('ios');
  vi.mocked(App.getInfo).mockResolvedValue({
    build: 'unknown',
    id: 'test.app',
    name: 'Test',
    version: '1.0.0',
  });

  await expect(getClientCompatibility()).rejects.toThrow(
    'Native app build is unavailable',
  );
});
