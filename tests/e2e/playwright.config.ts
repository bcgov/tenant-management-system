import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './playwright_tests',
  fullyParallel: false,
  workers: 1,

  reporter: [['html', { open: 'never' }]],
  outputDir: './test-results',

  projects: [
    // Runs login and creates playwright/.auth/user.json
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        headless: true,
      },
    },

    // All E2E tests use the authenticated session
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        headless: true,
        storageState: 'support/user.json',
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
        ignoreHTTPSErrors: true,
      },
      dependencies: ['setup'],
    },
  ],
})
