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

  test('Checks the tenant request functionality', async () => {
    await sharedPage.getByText('Request a Tenant').click()
    const tenantName = sharedPage.getByLabel('Name of Tenant')
    await tenantName.fill('Test Tenant')
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
    const expectedItems = [
      'Agriculture and Food',
      'Attorney General',
      'BC Elections',
      'BC Public Service Agency',
      'Children and Family Development',
      "Citizens' Services",
      'Compliance and Enforcement Collaborative',
      'Corporate Information and Records Management Office',
      'Crown Agencies and Board Resourcing Office',
      'Education and Child Care',
      'Emergency Management and Climate Readiness',
      'Energy and Climate Solutions',
      'Environment and Parks',
      'Finance',
      'Forests',
      'Government Communications and Public Engagement',
      'Health',
      'Housing and Municipal Affairs',
      'Indigenous Relations and Reconciliation',
      'Infrastructure',
      'Intergovernmental Relations Secretariat',
      'Jobs, Economic Development and Innovation',
      'Labour',
      'Mining and Critical Materials',
      'Office of the Chief Information Officer',
      'Office of the Comptroller General',
      'Office of the Premier',
      'Public Safety and Solicitor General',
      'Social Development and Poverty Reduction',
      'Post-Secondary Education and Future Skills',
      'Provincial Treasury',
      "Public Sector Employers' Council Secretariat",
      'Tourism, Arts, Culture and Sport',
      'Transportation and Transit',
      'Treasury Board Staff',
      'Water, Land and Resource Stewardship',
    ]
    const options = sharedPage.locator('[role="listbox"] [role="option"]')
    await expect(options).toHaveCount(expectedItems.length)
    for (const item of expectedItems) {
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
