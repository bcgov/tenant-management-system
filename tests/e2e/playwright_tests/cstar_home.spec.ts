import { type Page, type BrowserContext } from '@playwright/test'
import {
  test,
  expect,
  openTenantsPage,
  openTenantUsersPage,
  submitIdirSearch,
} from '../support/tenant.fixture'

const authMode = process.env.E2E_AUTH_MODE ?? 'keycloak'

let sharedPage: Page
let sharedContext: BrowserContext

test.beforeAll(async ({ browser }) => {
  test.setTimeout(90_000)
  sharedContext = await browser.newContext({
    storageState: 'support/user.json',
  })
  sharedPage = await sharedContext.newPage()
  await openTenantsPage(sharedPage)
})

test.afterAll(async () => {
  await sharedContext?.close()
})

test.describe.serial('Landing page tests', () => {
  test('Checks the navigation links', async () => {
    await expect(
      sharedPage.getByRole('button', { name: 'Logout', exact: true }),
    ).toBeVisible()
    await expect(
      sharedPage.getByRole('link', { name: 'All tenants', exact: true }),
    ).toBeVisible()
    await expect(
      sharedPage.getByRole('button', { name: 'Request a tenant', exact: true }),
    ).toBeVisible()
  })
  test('Submit tenant request under a Ministry', async ({
    getOrCreateApprovedTenant,
  }) => {
    const approvedTenantName = await getOrCreateApprovedTenant(sharedPage)
    await sharedPage
      .getByRole('link', { name: 'All tenants', exact: true })
      .click()
    await sharedPage.getByRole('link', { name: approvedTenantName }).click()
    await expect(sharedPage).toHaveURL(/\/tenants\/[^/]+\/services$/, {
      timeout: 30_000,
    })
    await expect(
      sharedPage.getByRole('heading', {
        name: 'Connected services',
        exact: true,
      }),
    ).toBeVisible({ timeout: 15_000 })
  })
  test('Checks the tenant users page', async () => {
    test.setTimeout(60_000)
    test.skip(
      authMode !== 'idir',
      'This test requires the IDIR test account and data',
    )
    await openTenantUsersPage(sharedPage)
    await expect(sharedPage).toHaveURL(/\/tenants\/[^/]+\/users$/, {
      timeout: 30_000,
    })
    await expect(
      sharedPage.getByRole('heading', { name: 'Tenant users', exact: true }),
    ).toBeVisible()
    await expect(sharedPage.getByText('Groups', { exact: true })).toBeVisible()
    await expect(
      sharedPage.getByRole('link', { name: 'Tenant Users' }),
    ).toBeVisible()
    await expect(
      sharedPage.getByRole('link', { name: 'Connected Services' }),
    ).toBeVisible()
    await expect(sharedPage.getByRole('link', { name: 'Groups' })).toBeVisible()
    const tenantUsersLink = sharedPage.getByRole('link', {
      name: 'Tenant Users',
    })
    await expect(tenantUsersLink).toHaveAttribute('aria-current', 'page')
    const rows = sharedPage.locator('tr.v-data-table__tr')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('CHEFS')
    await expect(rows.first()).toContainText('Testing')
    await expect(rows.first()).toContainText('chefs.testing@gov.bc.ca')
    // Check that the roles are visible and can be removed
    const roles = ['Service User', 'Tenant Owner', 'User Admin']
    for (const role of roles) {
      await expect(
        sharedPage.getByText(new RegExp(`^${role}$`, 'i')),
      ).toBeVisible()
    }
    const removableRoles = ['Service User', 'User Admin']
    for (const role of removableRoles) {
      await expect(
        sharedPage.getByRole('button', {
          name: new RegExp(`^Remove role ${role} for `, 'i'),
        }),
      ).toBeVisible()
    }
    // Tenant Owner cannot be removed
    await expect(
      sharedPage.getByRole('button', {
        name: /^Remove role Tenant owner for /i,
      }),
    ).toHaveCount(0)
    // Validate menu button
    await expect(
      sharedPage.getByRole('button', {
        name: /^Open menu for CHEFS Testing$/i,
      }),
    ).toBeEnabled()
    const addUserButton = sharedPage.getByRole('button', {
      name: 'Add user to tenant',
    })
    await expect(addUserButton).toBeEnabled()
    await addUserButton.click()
  })
  test('Checks the IDIR User search', async () => {
    test.setTimeout(60_000)
    test.skip(
      authMode !== 'idir',
      'This test requires the IDIR test account and data',
    )
    await sharedPage
      .locator('.v-field')
      .filter({ hasText: 'Search by' })
      .locator('.v-field__input')
      .click()
    const expectedOptions = ['First name', 'Last name', 'Email']
    const options = sharedPage.getByRole('listbox').getByRole('option')
    await expect(options).toHaveCount(3)
    for (const option of expectedOptions) {
      await expect(
        sharedPage.getByRole('listbox').getByRole('option', {
          name: option,
          exact: true,
        }),
      ).toBeVisible()
    }
    await sharedPage
      .getByRole('option', { name: 'First name', exact: true })
      .click()
    await sharedPage
      .locator('.v-field')
      .filter({ hasText: 'Search text' })
      .locator('.v-field__input')
      .click()
    await expect(
      sharedPage.getByRole('button', {
        name: 'Search',
        exact: true,
      }),
    ).toBeDisabled()
    await expect(
      sharedPage.getByRole('button', {
        name: 'Cancel',
        exact: true,
      }),
    ).toBeVisible()
    await sharedPage.getByLabel('Search text').fill('NIMYA')
    await expect(
      sharedPage.getByRole('button', {
        name: 'Search',
        exact: true,
      }),
    ).toBeEnabled()
    await expect(
      sharedPage.getByRole('button', {
        name: 'Cancel',
        exact: true,
      }),
    ).toBeVisible()
    await submitIdirSearch(sharedPage)
    await expect(
      sharedPage.getByRole('button', {
        name: 'Cancel',
        exact: true,
      }),
    ).toBeEnabled()
    const secondTable = sharedPage.locator('table').nth(1)
    const row = secondTable.getByRole('row').filter({
      has: sharedPage.getByRole('cell', {
        name: 'nimya.1.john@gov.bc.ca',
        exact: true,
      }),
    })
    await expect(row.locator('td').nth(1)).toHaveText('Nimya')
    await expect(row.locator('td').nth(2)).toHaveText('John')
    await expect(row.locator('td').nth(3)).toHaveText('nimya.1.john@gov.bc.ca')
    await expect(row.locator('td').nth(4)).toHaveText('IDIR')
    await row.getByRole('checkbox', { name: 'Select row', exact: true }).check()
    const expectedRoles = [
      'Select all',
      'Service User',
      'Tenant Owner',
      'User Admin',
    ]
    for (const role of expectedRoles) {
      await expect(
        sharedPage.getByRole('checkbox', {
          name: new RegExp(`^${role}$`, 'i'),
        }),
      ).toBeVisible()
    }
    await expect(
      sharedPage.getByRole('button', {
        name: 'Add user',
        exact: true,
      }),
    ).toBeDisabled()
    await expect(
      sharedPage.getByRole('button', {
        name: 'Cancel',
        exact: true,
      }),
    ).toBeVisible()
    await sharedPage
      .getByRole('checkbox', {
        name: /^Service user$/i,
      })
      .check()
    await expect(
      sharedPage.getByRole('button', {
        name: 'Add user',
        exact: true,
      }),
    ).toBeEnabled()
  })
  test('Checks add/remove IDIR user', async () => {
    test.setTimeout(90_000)
    test.skip(
      authMode !== 'idir',
      'This test requires the IDIR test account and data',
    )
    const [addResponse] = await Promise.all([
      sharedPage.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          /\/tenants\/[^/]+\/users$/.test(new URL(response.url()).pathname),
        { timeout: 30_000 },
      ),
      sharedPage.getByRole('button', { name: 'Add user', exact: true }).click(),
    ])
    expect(
      addResponse.ok(),
      `Add user returned HTTP ${addResponse.status()}`,
    ).toBeTruthy()

    const tables = sharedPage.locator('table')
    await expect(tables).toHaveCount(1)
    const tenantTable = tables.first()
    const tenantRows = tenantTable.locator('tr.v-data-table__tr')
    await expect(tenantRows).toHaveCount(2)
    const tenantRow = tenantRows.filter({
      has: sharedPage.getByRole('cell', {
        name: 'nimya.1.john@gov.bc.ca',
        exact: true,
      }),
    })
    await expect(tenantRow.locator('td').nth(0)).toHaveText('Nimya')
    await expect(tenantRow.locator('td').nth(1)).toHaveText('John')
    await expect(tenantRow.locator('td').nth(2)).toHaveText(
      'nimya.1.john@gov.bc.ca',
    )
    await expect(tenantRow.locator('td').nth(3)).toContainText('IDIR')
    const rolesCell = tenantRow.locator('td').nth(4)
    await expect(rolesCell).toContainText(/Service user/i)
    // Remove added user
    const menuButton = sharedPage.getByRole('button', {
      name: /^Open menu for Nimya John$/i,
    })
    await expect(menuButton).toBeEnabled()
    await menuButton.click()
    await sharedPage.getByText('Remove user', { exact: true }).click()
    const cancelButton = sharedPage.getByTestId('button-cancel')
    await expect(cancelButton).toBeEnabled()
    const removeButton = sharedPage.getByTestId('button-remove')
    await expect(removeButton).toBeEnabled()
    const [removeResponse] = await Promise.all([
      sharedPage.waitForResponse(
        (response) =>
          response.request().method() === 'DELETE' &&
          /\/tenants\/[^/]+\/users\/[^/]+$/.test(
            new URL(response.url()).pathname,
          ),
        { timeout: 30_000 },
      ),
      removeButton.click(),
    ])
    expect(
      removeResponse.ok(),
      `Remove user returned HTTP ${removeResponse.status()}`,
    ).toBeTruthy()
    await expect(tenantRow).toHaveCount(0)

    await expect(tenantRows).toHaveCount(1)
    const updatedTenantRow = tenantRows.nth(0)
    await expect(updatedTenantRow.locator('td').nth(0)).toHaveText('CHEFS')
    await expect(updatedTenantRow.locator('td').nth(1)).toHaveText('Testing')
    await expect(updatedTenantRow.locator('td').nth(2)).toHaveText(
      'chefs.testing@gov.bc.ca',
    )
  })
})
