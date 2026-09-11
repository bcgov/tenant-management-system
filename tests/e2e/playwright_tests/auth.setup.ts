import { test as setup } from '@playwright/test'
import { login } from '../support/login'

const authFile = 'support/user.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('button-primary').filter({ hasText: 'IDIR' }).click()

  await login(page)

  // Save cookies, localStorage, etc.
  await page.context().storageState({ path: authFile })
})
