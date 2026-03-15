import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3003',
    browserName: 'chromium',
    headless: true,
    viewport: { width: 450, height: 800 },
    actionTimeout: 5000,
  },
  webServer: {
    command: 'npx vite --port 3003',
    port: 3003,
    reuseExistingServer: false,
    timeout: 15000,
  },
});
