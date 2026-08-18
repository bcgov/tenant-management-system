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
    await sharedPage.getByText('Approved').click()
    //Approve Tenant request
    await sharedPage.getByRole('button', { name: 'Submit' }).click()
    await expect(sharedPage.getByText('Success')).toBeVisible()
    await expect(
      sharedPage.getByText('Tenant request has been successfully updated'),
    ).toBeVisible()
    //Check visibility of approved tenant in the All Tenants list
    await sharedPage.getByText('All Tenants').click()
    await expect(sharedPage.getByText('Request a Tenant')).toBeVisible()
    await expect(sharedPage.getByText(tenantNameValue)).toBeVisible()
    await sharedPage.getByText(tenantNameValue).click()
  })
  test('Checks the tenant details page', async () => {
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
    //Check that the roles are visible and can be removed
    const roles = ['Service User', 'Tenant Owner', 'User Admin']
    for (const role of roles) {
      await expect(sharedPage.getByText(role, { exact: true })).toBeVisible()
    }
    const removableRoles = ['Service User', 'User Admin']
    for (const role of removableRoles) {
      await expect(sharedPage.getByLabel(`Remove Role ${role}`)).toBeVisible()
    }
    //Test that the Tenant Owner role cannot be removed for only one user in the tenant
    await expect(sharedPage.getByLabel('Remove Role Tenant Owner')).toHaveCount(
      0,
    )
    //Validate Menu button for updating user roles is visible and enabled
    await expect(
      sharedPage.getByRole('button', { name: 'Open Menu for CHEFS Testing' }),
    ).toBeEnabled()
    const addUserButton = sharedPage.getByTestId('floating-action-button')
    await expect(addUserButton).toContainText('Add another user to this tenant')
    await expect(addUserButton).toBeEnabled()
    await addUserButton.click()
  })
  test('Checks the IDIR User search', async () => {
    await sharedPage
      .locator('.v-field')
      .filter({ hasText: 'Search by' })
      .locator('.v-field__input')
      .click()
    const expectedOptions = ['First Name', 'Last Name', 'Email']
    const options = sharedPage.getByRole('listbox').getByRole('option')
    await expect(options).toHaveCount(3)
    for (const option of expectedOptions) {
      await expect(
        sharedPage
          .getByRole('listbox')
          .getByRole('option', { name: option, exact: true }),
      ).toBeVisible()
    }
    await sharedPage
      .locator('.v-field')
      .filter({ hasText: 'Search text' })
      .locator('.v-field__input')
      .click()
    await expect(
      sharedPage.getByRole('button', { name: 'Search', exact: true }),
    ).toBeDisabled()
    await expect(
      sharedPage.getByRole('button', { name: 'Cancel', exact: true }),
    ).toBeVisible()
    await sharedPage.getByLabel('Search text').fill('NIMYA')
    await expect(
      sharedPage.getByRole('button', { name: 'Search', exact: true }),
    ).toBeEnabled()
    await expect(
      sharedPage.getByRole('button', { name: 'Cancel', exact: true }),
    ).toBeVisible()
    await sharedPage
      .getByRole('button', { name: 'Search', exact: true })
      .click()
    await expect(
      sharedPage.getByRole('button', { name: 'Cancel', exact: true }),
    ).toBeEnabled()
    const secondTable = sharedPage.locator('table').nth(1)
    const row = secondTable.locator('tr.v-data-table__tr').first()
    await expect(row.locator('td').nth(1)).toHaveText('Nimya')
    await expect(row.locator('td').nth(2)).toHaveText('John')
    await expect(row.locator('td').nth(3)).toHaveText('nimya.1.john@gov.bc.ca')
    await expect(row.locator('td').nth(4)).toHaveText('IDIR')
    await sharedPage.locator('input[type="checkbox"]').nth(0).check()
    const expectedRoles = [
      'Select all',
      'Service User',
      'Tenant Owner',
      'User Admin',
    ]

    for (const role of expectedRoles) {
      await expect(
        sharedPage.getByRole('checkbox', { name: role }),
      ).toBeVisible()
    }
    await expect(
      sharedPage.getByRole('button', { name: 'Add User', exact: true }),
    ).toBeDisabled()
    await expect(
      sharedPage.getByRole('button', { name: 'Cancel', exact: true }),
    ).toBeVisible()
    await sharedPage.getByRole('checkbox', { name: 'Service User' }).check()
    await expect(
      sharedPage.getByRole('button', { name: 'Add User', exact: true }),
    ).toBeEnabled()
    await expect(
      sharedPage.getByRole('button', { name: 'Cancel', exact: true }),
    ).toBeVisible()
  })
  test('Checks add/remove IDIR user', async () => {
    await sharedPage
      .getByRole('button', { name: 'Add User', exact: true })
      .click()
    await expect(sharedPage.getByText('User Added')).toBeVisible()
    await expect(
      sharedPage.getByText('New user successfully added to this tenant'),
    ).toBeVisible()
    const tables = sharedPage.locator('table')
    await expect(tables).toHaveCount(1)
    // Validate that the newly added user is present in the tenant users table
    const tenantTable = tables.first()
    const tenantRows = tenantTable.locator('tr.v-data-table__tr')
    await expect(tenantRows).toHaveCount(2)
    // Validate the details of the newly added user
    const tenantRow = tenantRows.nth(1)
    await expect(tenantRow.locator('td').nth(0)).toHaveText('Nimya')
    await expect(tenantRow.locator('td').nth(1)).toHaveText('John')
    await expect(tenantRow.locator('td').nth(2)).toHaveText(
      'nimya.1.john@gov.bc.ca',
    )
    await expect(tenantRow.locator('td').nth(3)).toContainText('IDIR')
    //Verify that the newly added user has the correct role and that the remove role button is visible
    const rolesCell = tenantRow.locator('td').nth(4)
    await expect(rolesCell).toContainText('Service User')
    //Remove added user from the tenant
    const menuButton = sharedPage.getByRole('button', {
      name: 'Open Menu for Nimya John',
    })
    await expect(menuButton).toBeEnabled()
    await menuButton.click()
    await sharedPage.getByText('Offboard User', { exact: true }).click()
    const cancelButton = sharedPage.getByTestId('button-cancel')
    await expect(cancelButton).toBeEnabled()
    const removeButton = sharedPage.getByTestId('button-remove')
    await expect(removeButton).toBeEnabled()
    await sharedPage.getByRole('button', { name: 'Offboard User' }).click()
    await expect(sharedPage.getByText('User Removed')).toBeVisible()
    await expect(
      sharedPage.getByText('The user was successfully removed'),
    ).toBeVisible()
    await expect(tenantRows).toHaveCount(1)
    // Validate the updated tenant table after removing the user
    const updatedtenantRow = tenantRows.nth(0)
    await expect(updatedtenantRow.locator('td').nth(0)).toHaveText('CHEFS')
    await expect(updatedtenantRow.locator('td').nth(1)).toHaveText('Testing')
    await expect(updatedtenantRow.locator('td').nth(2)).toHaveText(
      'chefs.testing@gov.bc.ca',
    )
  })
})
