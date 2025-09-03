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
