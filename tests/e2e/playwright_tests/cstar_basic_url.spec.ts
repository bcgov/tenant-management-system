import { test, expect } from '@playwright/test'

test.describe('Basic URL validation', () => {
  test('should navigate to the home page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/$/)
  })
})
