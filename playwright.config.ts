import { defineConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Derive dirname in ESM
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// Load env variables for E2E (TEST_EMAIL / TEST_PASSWORD) from .env.local if present
try {
  const envLocalPath = path.resolve(__dirname, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  }
} catch {
  // ignore env load errors
}

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000, // 60 seconds per test
  use: {
    baseURL: 'http://localhost:5173',
    navigationTimeout: 60_000, // 60 seconds for page.goto()
    actionTimeout: 15_000, // 15 seconds for actions like click, fill, etc.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-test',
    headless: !!(
      process.env.CI ||
      process.env.NODE_ENV === 'test' ||
      process.env.HEADLESS === 'true'
    ),
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
