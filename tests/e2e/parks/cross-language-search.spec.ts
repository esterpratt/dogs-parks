import { test, expect } from '@playwright/test';
import { setupTestEnvironment } from '../helpers/setup';

// Cross-language search test: search for Hebrew park name while app is in English
// Tests the useParksCrossLanguageFilter functionality

test.describe('parks (cross-language search)', () => {
  test('can search for Hebrew park name "חיל הא" while app is in English and find "Heil Haavir" park', async ({
    page,
  }) => {
    await setupTestEnvironment(page);

    // Navigate to parks page
    await page.goto('/parks');

    // Allow initial data (parks + location) to resolve before interacting
    await page.waitForLoadState('networkidle');
    // Fallback small delay to cover React Query state propagation
    await page.waitForTimeout(500);

    // Verify we're on the parks page
    await expect(page).toHaveURL('/parks');

    // Resolve search input (by test id or placeholder)
    const searchInput = page.getByTestId('park-search-input');
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Search for Hebrew park name "חיל הא" (partial Hebrew name for "Heil Haavir")
    await searchInput.fill('חיל הא');

    // Wait for any park card to render (timing safeguard before filtering by title)
    await page.waitForSelector('[data-test="park-card"]', { timeout: 15000 });

    // Find park cards that contain "Heil Haavir" in the title
    const parkCards = page.getByTestId('park-card').filter({
      has: page.getByTestId('park-title').filter({ hasText: /Heil Haavir/i }),
    });

    // Verify that at least one park card with "Heil Haavir" title is found
    await expect
      .poll(async () => await parkCards.count(), {
        message:
          'Park card with "Heil Haavir" title not found when searching for Hebrew "חיל הא"',
        timeout: 15000,
      })
      .toBeGreaterThan(0);

    // Verify the park card is visible
    await expect(parkCards.first()).toBeVisible();

    // Click on the first matching park card
    await parkCards.first().click();

    // Verify we navigated to the park details page
    await expect(page).toHaveURL(/\/parks\//);

    // Verify the park details page shows the correct park
    // Look for live status heading as an indicator we're on the right park page
    const liveStatusHeading = page.getByTestId('live-status-heading');
    await expect(liveStatusHeading).toBeVisible();
  });

  test('can search for full Hebrew park name "חיל האוויר" while app is in English and find "Heil Haavir" park', async ({
    page,
  }) => {
    await setupTestEnvironment(page);

    // Navigate to parks page
    await page.goto('/parks');

    // Allow initial data (parks + location) to resolve before interacting
    await page.waitForLoadState('networkidle');
    // Fallback small delay to cover React Query state propagation
    await page.waitForTimeout(500);

    // Verify we're on the parks page
    await expect(page).toHaveURL('/parks');

    // Resolve search input (by test id or placeholder)
    const searchInput = page.getByTestId('park-search-input');
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Search for full Hebrew park name "חיל האוויר" (Hebrew name for "Heil Haavir")
    await searchInput.fill('חיל האוויר');

    // Wait for any park card to render (timing safeguard before filtering by title)
    await page.waitForSelector('[data-test="park-card"]', { timeout: 15000 });

    // Find park cards that contain "Heil Haavir" in the title
    const parkCards = page.getByTestId('park-card').filter({
      has: page.getByTestId('park-title').filter({ hasText: /Heil Haavir/i }),
    });

    // Verify that at least one park card with "Heil Haavir" title is found
    await expect
      .poll(async () => await parkCards.count(), {
        message:
          'Park card with "Heil Haavir" title not found when searching for Hebrew "חיל האוויר"',
        timeout: 15000,
      })
      .toBeGreaterThan(0);

    // Verify the park card is visible
    await expect(parkCards.first()).toBeVisible();

    // Click on the first matching park card
    await parkCards.first().click();

    // Verify we navigated to the park details page
    await expect(page).toHaveURL(/\/parks\//);

    // Verify the park details page shows the correct park
    // Look for live status heading as an indicator we're on the right park page
    const liveStatusHeading = page.getByTestId('live-status-heading');
    await expect(liveStatusHeading).toBeVisible();
  });

  test('can search for English park name "Heil Haavir" while app is in English and find the park', async ({
    page,
  }) => {
    await setupTestEnvironment(page);

    // Navigate to parks page
    await page.goto('/parks');

    // Allow initial data (parks + location) to resolve before interacting
    await page.waitForLoadState('networkidle');
    // Fallback small delay to cover React Query state propagation
    await page.waitForTimeout(500);

    // Verify we're on the parks page
    await expect(page).toHaveURL('/parks');

    // Resolve search input (by test id or placeholder)
    const searchInput = page.getByTestId('park-search-input');
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Search for English park name "Heil Haavir"
    await searchInput.fill('Heil Haavir');

    // Wait for any park card to render (timing safeguard before filtering by title)
    await page.waitForSelector('[data-test="park-card"]', { timeout: 15000 });

    // Find park cards that contain "Heil Haavir" in the title
    const parkCards = page.getByTestId('park-card').filter({
      has: page.getByTestId('park-title').filter({ hasText: /Heil Haavir/i }),
    });

    // Verify that at least one park card with "Heil Haavir" title is found
    await expect
      .poll(async () => await parkCards.count(), {
        message:
          'Park card with "Heil Haavir" title not found when searching for English "Heil Haavir"',
        timeout: 15000,
      })
      .toBeGreaterThan(0);

    // Verify the park card is visible
    await expect(parkCards.first()).toBeVisible();

    // Click on the first matching park card
    await parkCards.first().click();

    // Verify we navigated to the park details page
    await expect(page).toHaveURL(/\/parks\//);

    // Verify the park details page shows the correct park
    // Look for live status heading as an indicator we're on the right park page
    const liveStatusHeading = page.getByTestId('live-status-heading');
    await expect(liveStatusHeading).toBeVisible();
  });

  test('can search for English park name "Heil Haavir" while app is in Hebrew and find the park', async ({
    page,
  }) => {
    await setupTestEnvironment(page);

    // Navigate to parks page
    await page.goto('/parks');

    // Allow initial data (parks + location) to resolve before interacting
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Change app language to Hebrew - more robust approach
    // First, click the more button to open the menu
    const moreButton = page.getByTestId('navbar-more');
    await expect(moreButton).toBeVisible({ timeout: 10000 });
    await moreButton.click();

    // Wait for the menu to open and find the language switcher button
    const languageSwitcherButton = page.getByText('Language').first();
    await expect(languageSwitcherButton).toBeVisible({ timeout: 5000 });
    await languageSwitcherButton.click();

    // Wait for the language selection modal to open and click Hebrew
    const hebrewOption = page.getByText('עברית');
    await expect(hebrewOption).toBeVisible({ timeout: 5000 });
    await hebrewOption.click();

    // Wait for language change to take effect and page to reload
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify we're still on the parks page
    await expect(page).toHaveURL('/parks');

    // Resolve search input - try Hebrew placeholder first since we switched language
    const searchInput = page.getByTestId('park-search-input');
    await expect(searchInput).toBeVisible();

    // Search for English park name "Heil Haavir" while app is in Hebrew
    await searchInput.fill('Heil Haavir');

    // Wait for any park card to render (timing safeguard before filtering by title)
    await page.waitForSelector('[data-test="park-card"]', { timeout: 15000 });

    // Find park cards that contain "חיל האוויר" in the title (Hebrew)
    const parkCards = page.getByTestId('park-card').filter({
      has: page.getByTestId('park-title').filter({ hasText: /חיל האוויר/i }),
    });

    // Verify that at least one park card with "חיל האוויר" title is found
    await expect
      .poll(async () => await parkCards.count(), {
        message:
          'Park card with "חיל האוויר" title not found when searching for English "Heil Haavir" while app is in Hebrew',
        timeout: 15000,
      })
      .toBeGreaterThan(0);

    // Verify the park card is visible
    await expect(parkCards.first()).toBeVisible();

    // Click on the first matching park card
    await parkCards.first().click();

    // Verify we navigated to the park details page
    await expect(page).toHaveURL(/\/parks\//);

    // Verify the park details page shows the correct park
    // Look for live status heading as an indicator we're on the right park page
    const liveStatusHeading = page.getByTestId('live-status-heading');
    await expect(liveStatusHeading).toBeVisible();
  });
});
