import { type BrowserContext } from '@playwright/test'
import { idirTestUser as mockUser, mockIdirSearch } from './idir-search.mock'

// Isolated Docker runs remain self-contained, including when invoked by CI.
export const useRealSsoSearch =
  Boolean(process.env.CI) && process.env.E2E_ISOLATED !== 'true'

// The deployed tests used this directory account before local mocks were added.
export const idirTestUser = useRealSsoSearch
  ? {
      firstName: process.env.E2E_SSO_TEST_FIRST_NAME || 'Nimya',
      lastName: process.env.E2E_SSO_TEST_LAST_NAME || 'John',
      email: process.env.E2E_SSO_TEST_EMAIL || 'nimya.1.john@gov.bc.ca',
      attributes: {
        display_name: [process.env.E2E_SSO_TEST_DISPLAY_NAME || 'Nimya John'],
      },
    }
  : mockUser

export async function configureSsoSearch(context: BrowserContext): Promise<void> {
  if (!useRealSsoSearch) await mockIdirSearch(context)
}
