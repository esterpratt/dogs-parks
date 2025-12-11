import { Page, expect } from '@playwright/test';
import { waitForAppReady } from './setup';

interface LoginWithEmailParams {
  email: string;
  password: string;
}

/**
 * Logs a user in through the UI using provided credentials.
 * Assumes login page fields are annotated with data-test selectors.
 * Fails early with clear assertion messages if elements are missing.
 */
export async function loginWithEmail(
  page: Page,
  { email, password }: LoginWithEmailParams
): Promise<void> {
  await page.goto('/login?mode=login', { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);

  const emailField = page.getByTestId('login-email');
  const passwordField = page.getByTestId('login-password');
  const submitButton = page.getByTestId('login-submit');

  await expect(emailField, 'Email field should be visible').toBeVisible();
  await emailField.fill(email);

  await expect(passwordField, 'Password field should be visible').toBeVisible();
  await passwordField.fill(password);

  await expect(submitButton, 'Submit button should be visible').toBeVisible();
  await submitButton.click();

  await page.getByTestId('navbar-notifications-link').waitFor();
}

/**
 * Convenience helper: logs in using TEST_EMAIL / TEST_PASSWORD env vars.
 * Fails fast if variables are missing.
 */
export async function loginTestUser(page: Page): Promise<void> {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error('Missing TEST_EMAIL or TEST_PASSWORD env variables.');
  }
  await loginWithEmail(page, { email, password });
}

/**
 * Logs out if a logout control is present. Safe to call unconditionally.
 */
export async function logoutIfLoggedIn(page: Page): Promise<void> {
  const moreButton = page.getByTestId('navbar-more');
  await moreButton.click();
  const logoutButton = page.getByTestId('navbar-logout');
  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click();
  }
}

export { type LoginWithEmailParams };
