import { expect, test as setup } from '@playwright/test'

import { login, loginE2E } from '../support/login'

const authFile = 'support/user.json'
const keycloakUrl = new URL(
  process.env.E2E_KEYCLOAK_URL ?? 'http://localhost:8081',
)
const authMode =
  process.env.E2E_AUTH_MODE ??
  (process.env.E2E_KEYCLOAK_USERNAME ? 'keycloak' : 'idir')

setup('authenticate', async ({ page }) => {
  setup.setTimeout(120_000)

  await page.goto('/')

  await page.getByTestId('button-primary').filter({ hasText: 'IDIR' }).click()

  if (authMode === 'keycloak') {
    await expect(page).toHaveURL(
      (url) =>
        url.origin === keycloakUrl.origin &&
        url.pathname === '/realms/standard/protocol/openid-connect/auth' &&
        url.searchParams.get('client_id') === 'cstar-e2e',
    )
    await loginE2E(page)
  } else if (authMode === 'idir') {
    await login(page)
  } else {
    throw new Error(`Unsupported E2E_AUTH_MODE: ${authMode}`)
  }

  await page.context().storageState({ path: authFile })
})
