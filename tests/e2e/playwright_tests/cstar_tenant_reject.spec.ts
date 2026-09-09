import { test, expect, Page } from '@playwright/test'
import { login } from '../support/login'

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

  test('Submit tenant request and reject it', async () => {
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
    await sharedPage.getByText('Submit Request').click()
    await expect(sharedPage.getByText('Success')).toBeVisible()
    await sharedPage.getByText('settings').click()
    await sharedPage
      .locator('td', { hasText: tenantNameValue })
      .locator('xpath=following-sibling::td[1]')
      .getByText('NEW', { exact: true })
      .click()
    const statusField = sharedPage
      .locator('.v-field')
      .filter({ has: sharedPage.locator('label', { hasText: 'Status' }) })
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
    await sharedPage.getByRole('button', { name: 'Submit' }).click()
    await expect(sharedPage.getByText('Success')).toBeVisible()
    await expect(
      sharedPage.getByText('Tenant request has been successfully updated'),
    ).toBeVisible()
    //Check visibility of rejected tenant in the All Tenants list
    await sharedPage.getByText('All Tenants').click()
    await expect(sharedPage.getByText('Request a Tenant')).toBeVisible()
    await expect(sharedPage.getByText(tenantNameValue)).not.toBeVisible()
  })
})
