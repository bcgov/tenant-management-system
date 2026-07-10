import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './playwright_tests',
  fullyParallel: false,
  workers: 1,

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },

  reporter: [['html', { open: 'never' }]],
  outputDir: 'tests',

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
})
