import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },

  reporter: [['html', { open: 'never' }]],
  outputDir: 'test-results',

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
})
