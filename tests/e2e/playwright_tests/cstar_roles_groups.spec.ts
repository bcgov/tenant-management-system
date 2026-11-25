import { idirTestUser, configureSsoSearch } from '../support/sso-search'
import { type BrowserContext, type Page } from '@playwright/test'
import {
  test,
  expect,
  openTenantsPage,
  openTenantServicesPage,
  openTenantUsersPage,
  sharedPageVideoOptions,
  submitIdirSearch,
} from '../support/tenant.fixture'

let sharedPage: Page
let sharedContext: BrowserContext

test.beforeAll(async ({ browser }, testInfo) => {
  test.setTimeout(90_000)
  sharedContext = await browser.newContext({
    storageState: 'support/user.json',
    ...sharedPageVideoOptions(testInfo),
  })
  await configureSsoSearch(sharedContext)
  sharedPage = await sharedContext.newPage()
  await openTenantsPage(sharedPage)
})

test.afterAll(async () => {
  await sharedContext?.close()
})

test.describe.serial('Landing page tests', () => {
  test('Verify role updation', async ({ getOrCreateApprovedTenant }) => {
    const approvedTenantName = await getOrCreateApprovedTenant(sharedPage)
    await openTenantServicesPage(sharedPage, approvedTenantName)
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
    const userAdminRole = sharedPage.getByRole('checkbox', {
      name: 'User admin role',
      exact: true,
    })
    await expect(userAdminRole).toBeChecked()
    await userAdminRole.uncheck()
    await sharedPage.getByRole('button', { name: 'Save roles' }).click()
    await expect(sharedPage.getByRole('dialog')).toBeHidden()
    await expect(tenantUserRow).not.toContainText(/User admin/i)
    const snackbarUserAdminRemoved = sharedPage
      .getByRole('alert')
      .filter({ hasText: /tenant roles updated/i })
    await expect(snackbarUserAdminRemoved).toBeVisible()
    await snackbarUserAdminRemoved.getByText(/tenant roles updated/i).click()
    await expect(snackbarUserAdminRemoved).toBeHidden()

    // Restore the shared tenant's initial roles for other tests and reruns.
    await menuButton.click()
    await sharedPage.getByText('Edit tenant roles', { exact: true }).click()
    await userAdminRole.check()
    await sharedPage.getByRole('button', { name: 'Save roles' }).click()
    await expect(sharedPage.getByRole('dialog')).toBeHidden()
    await expect(tenantUserRow).toContainText(/User admin/i)
    const snackbarUserAdminAdded = sharedPage
      .getByRole('alert')
      .filter({ hasText: /tenant roles updated/i })
    await expect(snackbarUserAdminAdded).toBeVisible()
    await snackbarUserAdminAdded.getByText(/tenant roles updated/i).click()
    await expect(snackbarUserAdminAdded).toBeHidden()
  })
  test('Checks group creation && member addition && member removal', async () => {
    test.setTimeout(90_000)
    const page = sharedPage
    const groupName = `My Test Group ${Date.now()}`
    await page.getByRole('link', { name: 'Groups', exact: true }).click()
    await expect(page).toHaveURL(/\/tenants\/[^/]+\/groups$/, {
      timeout: 30_000,
    })
    const groupsPath = new URL(page.url()).pathname
    await page.getByRole('button', { name: 'Create a group' }).click()
    const createDialog = page.getByRole('dialog')
    await createDialog
      .getByRole('textbox', { name: 'Group name' })
      .fill(groupName)
    await createDialog
      .getByRole('textbox', { name: 'Group description' })
      .fill('Automation Test Group Description')
    await createDialog.getByLabel('Add me as a user to this group').check()
    await expect(
      createDialog.getByRole('button', { name: 'Cancel' }),
    ).toBeVisible()
    const [createResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname.endsWith(groupsPath),
        { timeout: 30_000 },
      ),
      createDialog.getByRole('button', { name: 'Create group' }).click(),
    ])
    expect(
      createResponse.ok(),
      `Create group returned HTTP ${createResponse.status()}`,
    ).toBeTruthy()
    await expect(createDialog).toBeHidden()
    await expect(
      page.getByRole('alert').filter({ hasText: /^Member added$/i }),
    ).toBeVisible({ timeout: 15_000 })

    const groupLink = page.getByRole('link', { name: groupName, exact: true })
    await expect(groupLink).toBeVisible()
    await groupLink.click()
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
    await page.getByLabel('Search text').fill(idirTestUser.firstName)
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
        name: idirTestUser.email,
        exact: true,
      }),
    })
    await expect(row.locator('td').nth(1)).toHaveText(idirTestUser.firstName)
    await expect(row.locator('td').nth(2)).toHaveText(idirTestUser.lastName)
    await expect(row.locator('td').nth(3)).toHaveText(idirTestUser.email)
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
          name: idirTestUser.email,
          exact: true,
        }),
      })
    await expect(addedMemberRow).toBeVisible()
    await expect(addedMemberRow).toContainText(idirTestUser.firstName)
    await expect(addedMemberRow).toContainText(idirTestUser.lastName)
    // Remove the added member from this group.
    const menuButton = addedMemberRow.getByRole('button', {
      name: `Open menu for ${idirTestUser.attributes.display_name[0]}`,
    })
    await expect(menuButton).toBeEnabled()
    await menuButton.click()
    await page.getByText('Remove member', { exact: true }).click()
    const removeDialog = page.getByRole('dialog')
    await expect(
      removeDialog.getByRole('heading', { name: 'Confirm remove member' }),
    ).toBeVisible()
    await expect(
      removeDialog.getByRole('button', { name: 'Cancel', exact: true }),
    ).toBeEnabled()
    const removeButton = removeDialog.getByRole('button', {
      name: 'Remove member',
      exact: true,
    })
    await expect(removeButton).toBeEnabled()
    const groupPath = new URL(page.url()).pathname.replace(/\/members$/, '')
    const [removeResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === 'DELETE' &&
          new URL(response.url()).pathname.includes(`${groupPath}/users/`),
        { timeout: 30_000 },
      ),
      removeButton.click(),
    ])
    expect(
      removeResponse.ok(),
      `Remove member returned HTTP ${removeResponse.status()}`,
    ).toBeTruthy()
    await expect(removeDialog).toBeHidden()
    await expect(addedMemberRow).toHaveCount(0)
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText('CHEFS')
    await expect(rows.first()).toContainText('Testing')
    await expect(rows.first()).toContainText('chefs.testing@gov.bc.ca')
  })
})
