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
    //await sharedPage.click('[data-testid="logout-button"]')
    await sharedPage.context().close()
  })

  test('Checks the login functionality', async () => {
    await sharedPage.goto('/')
    await expect(
      sharedPage.locator('[data-testid="login-button"]'),
    ).toBeVisible()
    await login(sharedPage)
  })

  test('Checks the navigation links', async () => {
    await expect(sharedPage.locator('[data-testid="help-nav"]')).toBeVisible()
  })
})
