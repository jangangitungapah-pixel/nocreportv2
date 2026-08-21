import { defineConfig } from '@playwright/test';

const T7_APP_ORIGIN = 'http://127.0.0.1:5174';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [['list']],
  use: {
    baseURL: T7_APP_ORIGIN,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5174',
    url: `${T7_APP_ORIGIN}/login`,
    reuseExistingServer: false,
    timeout: 30_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
