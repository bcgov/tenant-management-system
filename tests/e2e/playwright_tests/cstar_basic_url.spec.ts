import { test, expect } from '@playwright/test'
import { openAppPage } from '../support/tenant.fixture'

test.describe('Basic URL validation', () => {
  test('should navigate to the home page', async ({ page }) => {
    await openAppPage(
      page,
      '/',
      page.getByRole('button', { name: 'Request a tenant', exact: true }),
    )
    await expect(page).toHaveURL(/\/tenants$/)
  })
})
