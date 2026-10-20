import { type BrowserContext, type Page } from '@playwright/test'
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
  test('Verify role updation', async ({ getOrCreateApprovedTenant }) => {
    test.skip(
      authMode !== 'idir',
      'This test requires the IDIR test account and data',
    )
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
    ).toBeVisible()
    await openTenantUsersPage(sharedPage)
    await expect(sharedPage).toHaveURL(/\/tenants\/[^/]+\/users$/, {
      timeout: 30_000,
    })
    await expect(
      sharedPage.getByRole('heading', { name: 'Tenant users', exact: true }),
    ).toBeVisible()
    // Validate menu button
    // A newly approved tenant contains only the requesting user.
    const tenantUserRow = sharedPage.getByRole('row').filter({
      has: sharedPage.getByRole('button', { name: /^Open menu for / }),
    })
    await expect(tenantUserRow).toHaveCount(1)
    const menuButton = tenantUserRow.getByRole('button', {
      name: /^Open menu for /,
    })
    await expect(menuButton).toBeEnabled()
    await menuButton.click()
    await sharedPage.getByText('Edit tenant roles', { exact: true }).click()
    //Remove user admin role
    await expect(
      sharedPage.getByLabel('User admin', { exact: true }),
    ).toBeChecked()
    await sharedPage.getByLabel('User admin', { exact: true }).uncheck()
    await sharedPage.getByRole('button', { name: 'Save roles' }).click()
    await expect(sharedPage.getByRole('dialog')).toBeHidden()
    await expect(tenantUserRow).not.toContainText(/User admin/i)

    // Restore the shared tenant's initial roles for other tests and reruns.
    await menuButton.click()
    await sharedPage.getByText('Edit tenant roles', { exact: true }).click()
    await sharedPage.getByLabel('User admin', { exact: true }).check()
    await sharedPage.getByRole('button', { name: 'Save roles' }).click()
    await expect(sharedPage.getByRole('dialog')).toBeHidden()
    await expect(tenantUserRow).toContainText(/User admin/i)
  })
  test('Checks group creation && member addition', async () => {
    test.setTimeout(90_000)
    const page = sharedPage
    test.skip(
      authMode !== 'idir',
      'This test requires the IDIR test account and data',
    )
    await sharedPage.getByRole('link', { name: 'Groups', exact: true }).click()
    await expect(sharedPage).toHaveURL(/\/tenants\/[^/]+\/groups$/, {
      timeout: 30_000,
    })
    await sharedPage.getByRole('button', { name: 'Create a group' }).click()
    await sharedPage
      .getByRole('textbox', { name: 'Group name' })
      .fill('My Test Group')
    await sharedPage
      .getByRole('textbox', { name: 'Group description' })
      .fill('Automation Test Group Description')
    await sharedPage.getByLabel('Add me as a user to this group').check()
    await expect(
      sharedPage.getByRole('button', { name: 'Cancel' }),
    ).toBeVisible()
    await sharedPage.getByRole('button', { name: 'Create group' }).click()
    await expect(sharedPage.getByText('My Test Group')).toBeVisible()
    await sharedPage.getByText('My Test Group').click()
    const rows = sharedPage.locator('tr.v-data-table__tr')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('CHEFS')
    await expect(rows.first()).toContainText('Testing')
    await expect(rows.first()).toContainText('chefs.testing@gov.bc.ca')
    await expect(sharedPage.getByText('Add member to group')).toBeVisible()
    await sharedPage.getByText('Add member to group').click()
    await expect(
      sharedPage.getByText(
        'Adding a member to a group also adds them to this tenant as a service user.',
      ),
    ).toBeVisible()

    await sharedPage
      .locator('.v-field')
      .filter({ hasText: 'Search by' })
      .locator('.v-field__input')
      .click()
    const expectedOptions = ['First name', 'Last name', 'Email']
    const options = page.getByRole('listbox').getByRole('option')
    await expect(options).toHaveCount(3)
    for (const option of expectedOptions) {
      await expect(
        page.getByRole('listbox').getByRole('option', {
          name: option,
          exact: true,
        }),
      ).toBeVisible()
    }
    await page.getByRole('option', { name: 'First name', exact: true }).click()
    await page
      .locator('.v-field')
      .filter({ hasText: 'Search text' })
      .locator('.v-field__input')
      .click()
    await expect(
      page.getByRole('button', {
        name: 'Search',
        exact: true,
      }),
    ).toBeDisabled()
    await expect(
      page.getByRole('button', {
        name: 'Cancel',
        exact: true,
      }),
    ).toBeVisible()
    await page.getByLabel('Search text').fill('NIMYA')
    await expect(
      page.getByRole('button', {
        name: 'Search',
        exact: true,
      }),
    ).toBeEnabled()
    await expect(
      page.getByRole('button', {
        name: 'Cancel',
        exact: true,
      }),
    ).toBeVisible()
    await submitIdirSearch(page)
    await expect(
      page.getByRole('button', {
        name: 'Cancel',
        exact: true,
      }),
    ).toBeEnabled()
    const secondTable = page.locator('table').nth(1)
    const row = secondTable.getByRole('row').filter({
      has: page.getByRole('cell', {
        name: 'nimya.1.john@gov.bc.ca',
        exact: true,
      }),
    })
    await expect(row.locator('td').nth(1)).toHaveText('Nimya')
    await expect(row.locator('td').nth(2)).toHaveText('John')
    await expect(row.locator('td').nth(3)).toHaveText('nimya.1.john@gov.bc.ca')
    await expect(row.locator('td').nth(4)).toHaveText('IDIR')
    await expect(
      page.getByRole('button', {
        name: 'Add member',
        exact: true,
      }),
    ).toBeDisabled()
    await expect(
      page.getByRole('button', {
        name: 'Cancel',
        exact: true,
      }),
    ).toBeVisible()
    await row.getByRole('checkbox', { name: 'Select row', exact: true }).check()
    await expect(
      page.getByRole('button', {
        name: 'Add member',
        exact: true,
      }),
    ).toBeEnabled()
    await page
      .getByRole('button', {
        name: 'Add member',
        exact: true,
      })
      .click()

    const snackbarUserAdded = page.getByRole('alert').filter({
      hasText: /^Member added(?: to group and tenant as a service user)?$/i,
    })
    await expect(snackbarUserAdded).toBeVisible()
    const addedMemberRow = page
      .getByRole('table')
      .first()
      .getByRole('row')
      .filter({
        has: page.getByRole('cell', {
          name: 'nimya.1.john@gov.bc.ca',
          exact: true,
        }),
      })
    await expect(addedMemberRow).toBeVisible()
    await expect(addedMemberRow).toContainText('Nimya')
    await expect(addedMemberRow).toContainText('John')
  })
})
