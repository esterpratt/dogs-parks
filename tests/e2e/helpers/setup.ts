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

  // Capture console messages for debugging
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`Browser console error: ${msg.text()}`);
    }
  });

  // Capture page errors
  page.on('pageerror', (error) => {
    console.error(`Page error: ${error.message}`);
  });
}

/**
 * Wait for the React app to hydrate and be ready.
 * This waits for the #preload loading screen to be removed from the DOM.
 */
export async function waitForAppReady(page: Page) {
  try {
    // Wait for the preload element to be hidden/removed
    // The preload element is removed when React hydrates (see main.tsx)
    await page.waitForSelector('#preload', { state: 'hidden', timeout: 30000 });
  } catch (error) {
    // If preload never disappears, log console errors and take a screenshot for debugging
    console.error('Preload element never disappeared. Checking for errors...');

    // Get any console errors from the page
    const logs = await page.evaluate(() => {
      return {
        errors: (window as { __pageErrors?: string[] }).__pageErrors || [],
        html: document.documentElement.outerHTML.substring(0, 500),
      };
    });
    console.error('Page state:', logs);

    throw new Error(
      `React app failed to hydrate within 30 seconds. Preload element still visible. ${
        logs.errors.length > 0 ? 'Console errors: ' + JSON.stringify(logs.errors) : ''
      }`
    );
  }
}
