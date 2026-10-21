import { test, expect, type Page, type BrowserContext } from '@playwright/test'
import { openAppPage, openTenantsPage } from '../support/tenant.fixture'

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
  test('Checks the homepage', async () => {
    await expect(sharedPage.getByText('Logout')).toBeVisible()
  })

  test('Checks the navigation links', async () => {
    await expect(
      sharedPage.getByRole('link', { name: 'all tenants' }),
    ).toBeVisible()
    await expect(sharedPage.getByText('Request a Tenant')).toBeVisible()
  })

  test('Submit tenant request under a Ministry', async () => {
    test.setTimeout(120_000)
    await sharedPage.getByText('Request a Tenant').click()

    const tenantName = sharedPage.getByLabel('Name of Tenant')
    const tenantNameValue = `Test Tenant ${Date.now()}`

    await tenantName.fill(tenantNameValue)

    await expect(
      sharedPage.locator('[data-testid="button-secondary"]'),
    ).toContainText('Cancel')

    await expect(
      sharedPage.getByRole('button', { name: 'Cancel' }),
    ).toBeEnabled()

    // Select Ministry list
    await sharedPage
      .locator('.v-field')
      .filter({ hasText: 'Ministry/Organization' })
      .click()
    await sharedPage
      .locator('[role="listbox"] [role="option"]')
      .filter({ hasText: 'Health' })
      .click()
    const tenantDescription = sharedPage.getByLabel('Description of Tenant')

    await tenantDescription.fill('Test Tenant Description')

    await sharedPage
      .getByRole('button', { name: 'Create tenant request' })
      .click()

    const snackbarTenantRequestSubmitted = sharedPage
      .getByRole('alert')
      .filter({ hasText: /tenant request submitted/i })
    await expect(snackbarTenantRequestSubmitted).toBeVisible()
    await snackbarTenantRequestSubmitted
      .getByText(/tenant request submitted/i)
      .click()
    await expect(snackbarTenantRequestSubmitted).toBeHidden()

    await openAppPage(
      sharedPage,
      '/settings/requests',
      sharedPage.getByRole('heading', { name: 'Tenant requests', exact: true }),
    )
    await sharedPage
      .getByRole('textbox', { name: 'Search', exact: true })
      .fill(tenantNameValue)

    await sharedPage
      .getByRole('row')
      .filter({ hasText: tenantNameValue })
      .getByText('NEW', { exact: true })
      .click()

    const statusField = sharedPage.locator('.v-field').filter({
      has: sharedPage.locator('label', { hasText: 'Status' }),
    })

    await statusField.locator('.v-field__input').click()

    await expect(
      sharedPage.getByText('Approved', { exact: true }),
    ).toBeVisible()

    await expect(
      sharedPage.getByText('Rejected', { exact: true }),
    ).toBeVisible()
    await sharedPage.getByText('Rejected').click()
    const rejectionNotes = sharedPage.getByLabel('Rejection Notes')
    await rejectionNotes.fill('Test rejection reason')
    //Reject Tenant request
    await sharedPage.getByRole('button', { name: 'Update status' }).click()
    //Check visibility of rejected tenant in the All Tenants list
    await sharedPage.getByRole('link', { name: 'all tenants' }).click()
    await expect(sharedPage.getByText('Request a Tenant')).toBeVisible()
    await expect(sharedPage.getByText(tenantNameValue)).not.toBeVisible()
  })
})
