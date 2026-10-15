import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.BASE_URL || 'http://localhost:5173/'
const baseUrl = new URL(baseURL)
const isLocalRun =
  !process.env.CI &&
  (baseUrl.hostname === 'localhost' || baseUrl.hostname === '127.0.0.1')
const e2eKeycloakUrl = process.env.E2E_KEYCLOAK_URL ?? 'http://localhost:8082'
const e2eKeycloakRealm = process.env.E2E_KEYCLOAK_REALM ?? 'standard'
const e2eAuthMode =
  process.env.E2E_AUTH_MODE ??
  (process.env.E2E_KEYCLOAK_USERNAME ? 'keycloak' : 'idir')

const localBackendEnv: Record<string, string> =
  e2eAuthMode === 'keycloak'
    ? {
        ISSUER: new URL(`/realms/${e2eKeycloakRealm}`, e2eKeycloakUrl).href,
        JWKS_URI: new URL(
          `/realms/${e2eKeycloakRealm}/protocol/openid-connect/certs`,
          e2eKeycloakUrl,
        ).href,
        TMS_AUDIENCE: process.env.TMS_AUDIENCE ?? 'cstar-e2e',
      }
    : {}

export default defineConfig({
  testDir: './playwright_tests',
  fullyParallel: false,
  workers: 1,

  reporter: [['html', { open: 'never' }]],
  outputDir: './test-results',

  webServer: isLocalRun
    ? [
        {
          command: 'npm run dev',
          cwd: '../../backend',
          url: 'http://localhost:4144/v1/health',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: localBackendEnv,
        },
        {
          command: 'npm run dev -- --host 0.0.0.0',
          cwd: '../../frontend',
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      ]
    : undefined,

  projects: [
    // Runs login and creates playwright/.auth/user.json
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
        headless: true,
      },
    },

    // All E2E tests use the authenticated session
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        baseURL,
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
