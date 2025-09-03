import { test, expect } from '@playwright/test';
import { setupTestEnvironment } from '../helpers/setup';
import { loginTestUser } from '../helpers/auth';

// User flow: open first park and open report condition modal from Live status section.
// Auth: uses TEST_EMAIL / TEST_PASSWORD env vars.

test.describe('parks (user)', () => {
  test('user can open first park and open report condition modal', async ({
    page,
  }) => {
    await setupTestEnvironment(page);
    await loginTestUser(page);

    await page.goto('/parks');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const firstCard = page.getByTestId('park-card').first();
    await firstCard.waitFor({ timeout: 15000 });
    await firstCard.click();

    await expect(page).toHaveURL(/\/parks\//);

    const liveStatusHeading = page.getByTestId('live-status-heading');
    await expect(liveStatusHeading).toBeVisible();

    const reportButton = page.getByTestId('report-button');
    await expect(reportButton).toBeVisible();
    await reportButton.click();

    const reportModal = page.getByTestId('report-condition-modal');
    await expect(reportModal).toBeVisible();
  });
});
