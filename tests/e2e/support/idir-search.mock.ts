import { type BrowserContext } from '@playwright/test'

export const idirTestUser = {
  firstName: 'E2E',
  lastName: 'User',
  email: 'e2e.user@example.com',
  attributes: {
    display_name: ['E2E User'],
    idir_username: ['E2EUSER'],
    idir_user_guid: ['1234567890ABCDEF1234567890ABCDEF'],
  },
}

// Install on the context so shared pages and subsequent navigations use it.
export async function mockIdirSearch(context: BrowserContext): Promise<void> {
  // The UI searches BCeID alongside IDIR and rejects both results if either fails.
  await context.route(
    (url) => url.pathname.endsWith('/users/bcgovssousers/bceid/search'),
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      })
    },
  )
  await context.route(
    (url) => url.pathname.endsWith('/users/bcgovssousers/idir/search'),
    async (route) => {
      const params = new URL(route.request().url()).searchParams
      const fields = ['firstName', 'lastName', 'email'] as const
      const searches = fields.filter((field) => params.has(field))
      const matches =
        searches.length > 0 &&
        searches.every((field) =>
          idirTestUser[field]
            .toLowerCase()
            .includes(params.get(field)!.toLowerCase()),
        )
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: matches ? [idirTestUser] : [] }),
      })
    },
  )
}
