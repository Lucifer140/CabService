import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * Pune Mumbai Cab / Sangita Travels Pune
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari (iPhone 14)',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: {
    command: 'python3 backend/server.py',
    url: 'http://localhost:8080/api/public/site-data',
    reuseExistingServer: !process.env.CI,
    timeout: 10000,
  },
});
