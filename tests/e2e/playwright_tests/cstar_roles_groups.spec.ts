import { Page, Browser } from '@playwright/test'
import { test, expect } from '../support/tenant.fixture'

let sharedPage: Page

test.beforeAll(async ({ browser }: { browser: Browser }) => {
  const context = await browser.newContext({
    storageState: 'support/user.json',
  })
  sharedPage = await context.newPage()
  await sharedPage.goto('/')
})
test.describe.serial('Landing page tests', () => {
  test('Verify role updation', async ({ createApprovedTenant }) => {
    const approvedTenantName = await createApprovedTenant(sharedPage)
    await sharedPage.goto('/tenants')
    await expect(sharedPage.getByText(approvedTenantName)).toBeVisible()
    await sharedPage.getByText(approvedTenantName).click()
    await sharedPage.getByText('Tenant Users').click()
    // Validate menu button
    const menuButton = sharedPage.getByRole('button', {
      name: 'Open Menu for CHEFS Testing',
    })
    await expect(menuButton).toBeEnabled()
    await menuButton.click()
    await sharedPage.getByText('Edit tenant roles', { exact: true }).click()
    //Remove user admin role
    await sharedPage.getByLabel('User admin').uncheck()
    await sharedPage.getByRole('button', { name: 'Save roles' }).click()
    const tenantUserRow = sharedPage
      .locator('tr.v-data-table__tr')
      .filter({ hasText: 'CHEFS Testing' })
    await expect(tenantUserRow).not.toContainText('User Admin')
  })
  test('Verify group creation', async ({ createApprovedTenant }) => {
    const approvedTenantName = await createApprovedTenant(sharedPage)
    await sharedPage.goto('/tenants')
    await sharedPage.getByText(approvedTenantName).click()
    await sharedPage.locator('a[href*="/tenants/"][href$="/groups"]').click()
    await sharedPage.getByRole('button', { name: 'Create a group' }).click()
  })
})
