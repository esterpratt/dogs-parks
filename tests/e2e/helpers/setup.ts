import { Page, BrowserContext } from '@playwright/test';

interface SetupTestEnvironmentParams {
  geolocation?: { latitude: number; longitude: number };
  viewport?: { width: number; height: number };
}

const DEFAULT_GEO = { latitude: 32.0853, longitude: 34.7818 };
const DEFAULT_VIEWPORT = { width: 390, height: 844 };

export async function setupTestEnvironment(
  page: Page,
  params: SetupTestEnvironmentParams = {}
) {
  const { geolocation = DEFAULT_GEO, viewport = DEFAULT_VIEWPORT } = params;
  const context: BrowserContext = page.context();

  // Grant geolocation permission & set coordinates
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation(geolocation);

  // Force mobile viewport
  await page.setViewportSize(viewport);
}

/**
 * Wait for the React app to hydrate and be ready.
 * This waits for the #preload loading screen to be removed from the DOM.
 */
export async function waitForAppReady(page: Page) {
  // Wait for the preload element to be hidden/removed
  // The preload element is removed when React hydrates (see main.tsx)
  await page.waitForSelector('#preload', { state: 'hidden', timeout: 30000 });
}
