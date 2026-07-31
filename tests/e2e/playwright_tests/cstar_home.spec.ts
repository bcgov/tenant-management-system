import { test, expect, Page } from '@playwright/test'
import { login } from '../support/login'
import { MINISTRIES } from '../../../frontend/src/utils/constants'

let sharedPage: Page

test.describe.serial('Landing page tests', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    sharedPage = await context.newPage()
  })

  test.afterAll(async () => {
    //Logout after tests — logout lives inside the user dropdown, so open it first
    await sharedPage.getByText('Logout').click()
    await sharedPage.context().close()
  })

  test('Checks the login functionality', async () => {
    await sharedPage.goto('/')
    await sharedPage
      .getByTestId('button-primary')
      .filter({ hasText: 'IDIR' })
      .click()
    await login(sharedPage)
  })

  test('Checks the navigation links', async () => {
    await expect(sharedPage.getByText('All Tenants')).toBeVisible()
    await expect(sharedPage.getByText('Request a Tenant')).toBeVisible()
  })

  test('Submit tenant request under a Ministry', async () => {
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
    const options = sharedPage.locator('[role="listbox"] [role="option"]')
    await expect(options).toHaveCount(MINISTRIES.length)
    for (const item of MINISTRIES) {
      await expect(options.filter({ hasText: item })).toHaveCount(1)
    }
    await sharedPage
      .locator('[role="listbox"] [role="option"]')
      .filter({ hasText: 'Health' })
      .click()
    const tenantDescription = sharedPage.getByLabel('Description of Tenant')
    await tenantDescription.fill('Test Tenant Description')
    await sharedPage.getByText('Submit Request').click()
    await expect(sharedPage.getByText('Success')).toBeVisible()
  })
})
