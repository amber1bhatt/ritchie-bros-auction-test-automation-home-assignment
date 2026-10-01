import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

import { env } from './src/config/env';

const reporters: ReporterDescription[] = [
  ['html', { open: 'never' }],
  ['./src/reporters/validation-reporter.ts'],
];
if (env.isCI) reporters.unshift(['github']);
// only when an OTLP endpoint is set
if (env.otel.endpoint) reporters.push(['./src/reporters/otel-reporter.ts']);

export default defineConfig({
  testDir: './tests',
  // tests only read, so tests in the same file can run in parallel too
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.retries,
  workers: env.workers,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: reporters,
  use: {
    baseURL: env.baseUrl,
    headless: env.headless,
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
