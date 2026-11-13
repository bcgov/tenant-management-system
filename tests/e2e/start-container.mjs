import { spawnSync } from 'node:child_process'
import { generateKeyPairSync } from 'node:crypto'
import { setTimeout } from 'node:timers/promises'
import { mockSsoEnvironment } from './sso-env.mjs'

Object.assign(process.env, mockSsoEnvironment)

// Generate disposable signing keys without loading any developer credentials.
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
})
process.env.ASSERTION_PRIVATE_KEY = privateKey
process.env.ASSERTION_PUBLIC_KEY = publicKey

const discoveryURL = `${process.env.ISSUER}/.well-known/openid-configuration`
const deadline = Date.now() + 120_000
async function waitForKeycloak() {
  if (Date.now() >= deadline) return false

  try {
    const response = await fetch(discoveryURL, {
      signal: AbortSignal.timeout(5_000),
    })
    if (response.ok) return true
  } catch {
    // Keycloak can accept connections before the imported realm is ready.
  }
  await setTimeout(2_000)
  return waitForKeycloak()
}
const ready = await waitForKeycloak()
if (!ready) {
  console.error('E2E Keycloak realm did not become ready within 120 seconds.')
  process.exit(1)
}

function run(args, cwd) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
  })
  if (result.error) {
    console.error(result.error.message)
  }
  return result.status ?? 1
}

const migrationStatus = run(
  [
    '--require',
    'ts-node/register',
    'node_modules/typeorm/cli.js',
    'migration:run',
    '-d',
    'src/common/db.connection.ts',
  ],
  '/app/backend',
)
if (migrationStatus !== 0) process.exit(migrationStatus)

process.exit(
  run(
    ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)],
    '/app/tests/e2e',
  ),
)
