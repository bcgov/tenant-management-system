import {
  expect,
  test as base,
  type Locator,
  type Page,
  type Request,
} from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { MINISTRIES } from '../../../frontend/src/utils/constants'

type TenantFixtures = {
  getOrCreateApprovedTenant: (page: Page) => Promise<string>
}

export async function submitIdirSearch(page: Page): Promise<void> {
  const searchResponse = page.waitForResponse(
    (response) =>
      response.request().method() === 'GET' &&
      new URL(response.url()).pathname.endsWith(
        '/users/bcgovssousers/idir/search',
      ),
    { timeout: 30_000 },
  )
  const [response] = await Promise.all([
    searchResponse,
    page.getByRole('button', { name: 'Search', exact: true }).click(),
  ])
  expect(
    response.ok(),
    `IDIR search returned HTTP ${response.status()}`,
  ).toBeTruthy()
}

export async function openTenantsPage(page: Page): Promise<void> {
  const requestTenantButton = page.getByRole('button', {
    name: 'Request a tenant',
    exact: true,
  })
  if (
    new URL(page.url()).pathname === '/tenants' &&
    (await requestTenantButton.isVisible())
  ) {
    return
  }
  await openAppPage(page, '/tenants', requestTenantButton)
}

export async function openTenantUsersPage(page: Page): Promise<void> {
  const usersPath = await page
    .getByRole('link', { name: 'Tenant users', exact: true })
    .getAttribute('href')
  expect(usersPath).toMatch(/^\/tenants\/[^/]+\/users$/)
  await openAppPage(
    page,
    usersPath!,
    page.getByRole('heading', { name: 'Tenant users', exact: true }),
  )
}

export async function openTenantServicesPage(
  page: Page,
  tenantName: string,
): Promise<void> {
  await openTenantsPage(page)
  const servicesLink = page
    .getByRole('link')
    .filter({ has: page.getByText(tenantName, { exact: true }) })
  const servicesPath = await servicesLink.getAttribute('href')
  expect(servicesPath).toMatch(/^\/tenants\/[^/]+\/services$/)
  // Follow the app's router links instead of reloading tenant deep URLs.
  await servicesLink.click()
  await expect(page).toHaveURL(new URL(servicesPath!, page.url()).href)
  // The heading depends on the environment's services and the tenant's roles.
  await expect(
    page.getByRole('heading', {
      name: /^(Connected services|Add your first connected service|No connected services have been added)$/,
    }),
  ).toBeVisible({ timeout: 15_000 })
}

export async function openAppPage(
  page: Page,
  path: string,
  ready: Locator,
): Promise<void> {
  let startupNetworkFailed = false
  const trackStartupFailure = (request: Request) => {
    const url = new URL(request.url())
    if (
      url.origin === new URL(page.url()).origin &&
      request.method() === 'GET' &&
      ['document', 'script', 'stylesheet', 'fetch', 'xhr'].includes(
        request.resourceType(),
      ) &&
      request.failure()?.errorText === 'net::ERR_EMPTY_RESPONSE'
    ) {
      startupNetworkFailed = true
    }
  }

  page.on('requestfailed', trackStartupFailure)
  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      startupNetworkFailed = false
      try {
        await page.goto(path)
        await expect(ready).toBeVisible({ timeout: 15_000 })
        // A page can render after catching a failed data load (such as roles).
        // Reload only read requests; never replay form submissions.
        if (startupNetworkFailed)
          throw new Error(`A startup request failed while opening ${path}`)
        return
      } catch (error) {
        // Retry only connection failures while opening a page, before any writes.
        const navigationFailed =
          error instanceof Error &&
          error.message.includes('net::ERR_EMPTY_RESPONSE')
        if ((!startupNetworkFailed && !navigationFailed) || attempt === 2)
          throw error
      }
    }
  } finally {
    page.off('requestfailed', trackStartupFailure)
  }
}

export const test = base.extend<TenantFixtures>({
  getOrCreateApprovedTenant: async ({}, use, testInfo) => {
    await use(async (page) => {
      testInfo.setTimeout(120_000)
      // Playwright clears outputDir at the start of each run. With workers: 1,
      // both specs reuse this tenant, including after a worker restarts.
      const sharedTenantFile = join(
        testInfo.project.outputDir,
        'shared-tenant.json',
      )
      try {
        const sharedTenant: { name: string } = JSON.parse(
          await readFile(sharedTenantFile, 'utf8'),
        )
        testInfo.annotations.push({
          type: 'tenant',
          description: sharedTenant.name,
        })
        return sharedTenant.name
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
      const tenantNameValue = `Test Tenant ${Date.now()}`

      await openTenantsPage(page)
      await page
        .getByRole('button', { name: 'Request a tenant', exact: true })
        .click()
      await page.getByLabel('Name of Tenant').fill(tenantNameValue)
      await expect(
        page.locator('[data-testid="button-secondary"]'),
      ).toContainText('Cancel')
      await expect(page.getByRole('button', { name: 'Cancel' })).toBeEnabled()

      await page
        .locator('.v-field')
        .filter({ hasText: 'Ministry/Organization' })
        .click()
      const options = page.locator('[role="listbox"] [role="option"]')
      await expect(options).toHaveCount(MINISTRIES.length)
      await Promise.all(
        MINISTRIES.map((item) =>
          expect(options.filter({ hasText: item })).toHaveCount(1),
        ),
      )
      await options.filter({ hasText: 'Health' }).click()
      await page
        .getByLabel('Description of Tenant')
        .fill('Test Tenant Description')
      const [createResponse] = await Promise.all([
        page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' &&
            new URL(response.url()).pathname.endsWith('/tenant-requests'),
          { timeout: 30_000 },
        ),
        page.getByRole('button', { name: 'Create tenant request' }).click(),
      ])
      expect(
        createResponse.ok(),
        `Create tenant request returned HTTP ${createResponse.status()}`,
      ).toBeTruthy()
      await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15_000 })
      await openAppPage(
        page,
        '/settings/requests',
        page.getByRole('textbox', { name: 'Search', exact: true }),
      )
      await page
        .getByRole('textbox', { name: 'Search', exact: true })
        .fill(tenantNameValue)
      await page
        .getByRole('row')
        .filter({ hasText: tenantNameValue })
        .getByText('NEW', { exact: true })
        .click()
      const statusField = page.locator('.v-field').filter({
        has: page.locator('label', { hasText: 'Status' }),
      })
      await statusField.locator('.v-field__input').click()
      await expect(page.getByText('Approved', { exact: true })).toBeVisible()
      await page.getByText('Approved', { exact: true }).click()
      await page.getByRole('button', { name: 'Update status' }).click()

      const approvedRequest = page
        .getByRole('row')
        .filter({ hasText: tenantNameValue })
      await expect(approvedRequest).toContainText('APPROVED')

      await mkdir(testInfo.project.outputDir, { recursive: true })
      await writeFile(
        sharedTenantFile,
        JSON.stringify({ name: tenantNameValue }),
        'utf8',
      )
      testInfo.annotations.push({
        type: 'tenant',
        description: tenantNameValue,
      })
      return tenantNameValue
    })
  },
})

export { expect }
