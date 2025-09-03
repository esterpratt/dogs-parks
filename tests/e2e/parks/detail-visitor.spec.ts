import { test, expect } from '@playwright/test';
import { setupTestEnvironment } from '../helpers/setup';

// Visitor flow: open Givatayim Park details page and verify live status heading has no report button for visitors.

test.describe('parks (visitor)', () => {
  test('visitor can open Givatayim Park and live status heading has no report button', async ({
    page,
  }) => {
    await setupTestEnvironment(page);
    await page.goto('/parks');
    // Allow initial data (parks + location) to resolve before interacting
    await page.waitForLoadState('networkidle');
    // Fallback small delay to cover React Query state propagation
    await page.waitForTimeout(500);

    // Resolve search input (by test id or placeholder)
    let searchInput = page.getByTestId('park-search-input');
    if (!(await searchInput.count())) {
      searchInput = page.getByPlaceholder('Search park');
    }
    await expect(searchInput).toBeVisible();

    // Single phase: apply search filter then wait for at least one matching card
    await searchInput.fill('Givatayim Park');
    // Wait for any park card to render (timing safeguard before filtering by title)
    await page.waitForSelector('[data-test="park-card"]', { timeout: 15000 });
    const parkCards = page.getByTestId('park-card').filter({
      has: page
        .getByTestId('park-title')
        .filter({ hasText: /Givatayim Park/i }),
    });
    await expect
      .poll(async () => await parkCards.count(), {
        message: 'Filtered park card not found for Givatayim Park',
        timeout: 15000,
      })
      .toBeGreaterThan(0);
    await parkCards.first().click();

    // URL and visible content assertions
    await expect(page).toHaveURL(/\/parks\//);
    // Park name selector was removed in code; rely on title in tab or fallback to live status presence
    const liveStatusHeading = page.getByTestId('live-status-heading');
    await expect(liveStatusHeading).toBeVisible();

    // As a visitor (not logged in) there should be no report button rendered
    await expect(page.getByTestId('report-button')).toHaveCount(0);
  });
});
