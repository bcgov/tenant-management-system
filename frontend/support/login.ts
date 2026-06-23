/// <reference types="node" />
import { expect, type Page } from '@playwright/test'
import { authenticator } from '@otplib/preset-default'

export function formsettings() {
  if (
    !process.env.IDIR_USERNAME ||
    !process.env.IDIR_PASSWORD ||
    !process.env.MFA_CODE
  ) {
    throw new Error('Missing env variables')
  }

  return {
    username: process.env.IDIR_USERNAME,
    password: process.env.IDIR_PASSWORD,
    mfaCode: process.env.MFA_CODE,
  }
}

export async function login(page: Page) {
  const { username, password, mfaCode } = formsettings()
  await page.fill('input[type="email"]', username)
  await page.click('input[type="submit"]')
  await page.fill('input[name="passwd"]', password)
  await page.click('input[type="submit"]')

  const token = authenticator.generate(mfaCode)
  console.log('Generated OTP:', token)
  await page.fill('input[name="otc"]', token)
  await page.click('input[type="submit"]')
  await page.click('input[type="submit"]')
  await expect(page.locator('#idSIButton9')).toBeVisible()
  await page.locator('#idSIButton9').click()
}
