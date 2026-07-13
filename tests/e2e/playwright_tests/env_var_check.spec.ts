import { test, expect } from '@playwright/test'
import { formsettings } from '../support/login' // adjust the path

test('throws an error when required environment variables are missing', () => {
  const original = {
    username: process.env.E2E_IDIR_USERNAME,
    password: process.env.E2E_IDIR_PASSWORD,
    mfa: process.env.E2E_MFA_CODE,
  }

  delete process.env.E2E_IDIR_USERNAME
  delete process.env.E2E_IDIR_PASSWORD
  delete process.env.E2E_MFA_CODE

  expect(() => formsettings()).toThrow('Missing env variables')

  // Restore environment variables
  process.env.E2E_IDIR_USERNAME = original.username
  process.env.E2E_IDIR_PASSWORD = original.password
  process.env.E2E_MFA_CODE = original.mfa
})
