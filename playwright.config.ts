import { existsSync } from 'node:fs';

import { defineConfig, devices } from '@playwright/test';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const BASE_URL = process.env.BASE_URL ?? 'https://www.rbauction.com';
const isCI = !!process.env.CI;

// the WAF returns 403 to headless chromium, so run headed by default
const headless = process.env.HEADLESS === 'true';

export default defineConfig({
  testDir: './tests',
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: process.env.PLAYWRIGHT_WORKERS ? Number(process.env.PLAYWRIGHT_WORKERS) : isCI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI
    ? [['github'], ['html', { open: 'never' }], ['./src/reporters/validation-reporter.ts']]
    : [['html', { open: 'never' }], ['./src/reporters/validation-reporter.ts']],
  use: {
    baseURL: BASE_URL,
    headless,
    navigationTimeout: 45_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'e2e',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: './tests/api',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
