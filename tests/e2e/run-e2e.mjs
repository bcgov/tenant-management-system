import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const [authMode, ...playwrightArgs] = process.argv.slice(2)

if (!['keycloak', 'idir'].includes(authMode ?? '')) {
  console.error(
    'Usage: npm run test:e2e:mode -- <keycloak|idir> [Playwright options]',
  )
  process.exit(1)
}

const requiredVariables =
  authMode === 'idir'
    ? ['E2E_IDIR_USERNAME', 'E2E_IDIR_PASSWORD', 'E2E_MFA_CODE']
    : ['E2E_KEYCLOAK_USERNAME', 'E2E_KEYCLOAK_PASSWORD']
const missingVariables = requiredVariables.filter((name) => !process.env[name])

if (missingVariables.length > 0) {
  console.error(
    `Missing required environment variables: ${missingVariables.join(', ')}`,
  )
  process.exit(1)
}

if (authMode === 'idir') {
  const baseURL =
    process.env.IDIR_BASE_URL ??
    process.env.BASE_URL ??
    'http://localhost:5173/'
  let hostname

  try {
    hostname = new URL(baseURL).hostname
  } catch {
    console.error('BASE_URL must be a valid absolute URL for IDIR mode.')
    process.exit(1)
  }

  if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    console.error(
      'IDIR mode requires BASE_URL to point to an IDIR-enabled deployed environment, not localhost.',
    )
    process.exit(1)
  }
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const playwrightCli = resolve(
  scriptDirectory,
  'node_modules/@playwright/test/cli.js',
)
const childEnvironment = { ...process.env, E2E_AUTH_MODE: authMode }
if (authMode === 'idir') {
  childEnvironment.BASE_URL =
    process.env.IDIR_BASE_URL ?? process.env.BASE_URL ?? 'http://localhost:5173/'
}

const result = spawnSync(
  process.execPath,
  [playwrightCli, 'test', ...playwrightArgs],
  {
    env: childEnvironment,
    stdio: 'inherit',
  },
)

if (result.error) {
  console.error(`Failed to start Playwright: ${result.error.message}`)
  process.exit(1)
}

process.exit(result.status ?? 1)
