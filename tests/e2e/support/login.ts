import { expect, type Page } from '@playwright/test'
import { authenticator } from '@otplib/preset-default'

export function formsettings() {
  if (
    !process.env.E2E_IDIR_USERNAME ||
    !process.env.E2E_IDIR_PASSWORD ||
    !process.env.E2E_MFA_CODE
  ) {
    throw new Error('Missing env variables')
  }

  return {
    username: process.env.E2E_IDIR_USERNAME,
    password: process.env.E2E_IDIR_PASSWORD,
    mfaCode: process.env.E2E_MFA_CODE,
  }
}

// Existing real IDIR + MFA login
export async function login(page: Page) {
  const { username, password, mfaCode } = formsettings()

  await page.fill('input[type="email"]', username)
  await page.click('input[type="submit"]')

  await page.fill('input[name="passwd"]', password)
  await page.click('input[type="submit"]')

  const token = authenticator.generate(mfaCode)

  await page.fill('input[name="otc"]', token)
  await page.click('input[type="submit"]')

  const tenantsUrl = /\/tenants(?:[?#].*)?$/
  const staySignedInButton = page.locator('#idSIButton9')
  await Promise.race([
    page.waitForURL(tenantsUrl, { timeout: 60_000 }),
    staySignedInButton.waitFor({ state: 'visible', timeout: 60_000 }),
  ])

  if (await staySignedInButton.isVisible().catch(() => false)) {
    await staySignedInButton.click()
  }

  await page.waitForURL(tenantsUrl, { timeout: 60_000 })
}

// Keycloak / mock OIDC E2E login
export async function loginE2E(page: Page) {
  const username = process.env.E2E_KEYCLOAK_USERNAME ?? ''
  const password = process.env.E2E_KEYCLOAK_PASSWORD ?? ''

  if (!username || !password) {
    throw new Error('Missing E2E_KEYCLOAK_USERNAME or E2E_KEYCLOAK_PASSWORD')
  }

  await page.waitForLoadState('domcontentloaded')

  const usernameField = page
    .locator(
      'input[name="username"], input[name="loginfmt"], input[type="email"], input[type="text"], #username, #email',
    )
    .first()

  await expect(usernameField).toBeVisible({ timeout: 30000 })
  await usernameField.fill(username)

  const nextButton = page
    .getByRole('button', { name: /next|sign in|continue/i })
    .first()
  if (await nextButton.isVisible().catch(() => false)) {
    await nextButton.click()
  }

  const passwordField = page
    .locator(
      'input[name="password"], input[name="passwd"], input[type="password"], #password',
    )
    .first()

  await expect(passwordField).toBeVisible({ timeout: 30000 })
  await passwordField.fill(password)

  const submitButton = page
    .getByRole('button', { name: /sign in|sign in with|continue|submit/i })
    .first()

  await expect(submitButton).toBeVisible({ timeout: 30000 })
  await submitButton.click()
}
