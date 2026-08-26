import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'

import { makeSsoUser, makeTenant, makeUser } from '@/__tests__/__factories__'

import UserSearch from '@/components/tenant/UserSearch.vue'
import type { Tenant } from '@/models/tenant.model'
import type { User } from '@/models/user.model'
import vuetify from '@/plugins/vuetify'
import { IDIR_SEARCH_TYPE } from '@/utils/constants'

const mockTenant = makeTenant()

const user1 = makeUser({
  ssoUser: makeSsoUser({
    email: 'ssoUserEmail1',
    firstName: 'ssoUserFirstName1',
    lastName: 'ssoUserLastName1',
  }),
})

const user2 = makeUser({
  ssoUser: makeSsoUser({
    email: 'ssoUserEmail2',
    firstName: 'ssoUserFirstName2',
    lastName: 'ssoUserLastName2',
  }),
})

const defaultProps: {
  currentUsers: User[] | null
  loading?: boolean
  searchResults: User[] | null
  tenant: Tenant
} = {
  currentUsers: null,
  searchResults: null,
  tenant: mockTenant,
}

const renderComponent = (props = defaultProps) => {
  return render(UserSearch, {
    props,
    global: {
      plugins: [vuetify],
      stubs: {
        UserSearchTable: {
          props: ['sortBy', 'tenant', 'users'],
          template: `
            <div>
              <button @click="$emit('row-clicked', users[0])">
                Select user
              </button>
              <button @click="$emit('row-clicked', null)">
                Clear selection
              </button>
            </div>
          `,
        },
      },
    },
  })
}

describe('UserSearch', () => {
  describe('search', () => {
    it('disables the Search button when search text has fewer than 2 characters', () => {
      renderComponent()

      expect(screen.getByRole('button', { name: 'Search' })).toBeDisabled()
    })

    it('enables the Search button when search text has at least 2 characters', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.type(screen.getByLabelText('Search text'), 'text')

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Search' })).toBeEnabled(),
      )
    })

    it('emits search with the selected search type and search text', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await user.type(screen.getByLabelText('Search text'), 'text')
      await user.click(screen.getByRole('button', { name: 'Search' }))

      expect(emitted().search).toEqual([
        [IDIR_SEARCH_TYPE.FIRST_NAME.value, 'text'],
      ])
    })

    it('emits search when Enter is pressed in the search text field', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      const searchText = screen.getByLabelText('Search text')

      await user.type(searchText, 'text')
      await user.keyboard('{Enter}')

      expect(emitted().search).toEqual([
        [IDIR_SEARCH_TYPE.FIRST_NAME.value, 'text'],
      ])
    })

    it('emits clear-search when search text changes', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await user.type(screen.getByLabelText('Search text'), 'text')

      await waitFor(() => expect(emitted()['clear-search']).toHaveLength(4))
    })

    it('emits clear-search when the search type changes', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      await user.click(screen.getByLabelText('Search by'))
      await user.click(
        screen.getByRole('option', {
          name: IDIR_SEARCH_TYPE.LAST_NAME.title,
        }),
      )

      await waitFor(() =>
        expect(emitted()['clear-search'].length).toBeGreaterThan(0),
      )
    })
  })

  describe('search results', () => {
    it('does not show search results when searchResults is null and loading is false', () => {
      renderComponent()

      expect(
        screen.queryByRole('heading', { name: 'Search Results' }),
      ).not.toBeInTheDocument()
    })

    it('shows search results when searchResults are provided', () => {
      renderComponent({
        ...defaultProps,
        searchResults: [user1],
      })

      expect(
        screen.getByRole('heading', { name: 'Search Results' }),
      ).toBeInTheDocument()
    })

    it('shows search results while loading', () => {
      renderComponent({
        ...defaultProps,
        loading: true,
      })

      expect(
        screen.getByRole('heading', { name: 'Search Results' }),
      ).toBeInTheDocument()
    })
  })

  describe('row selection', () => {
    it('emits the selected user', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({
        ...defaultProps,
        searchResults: [user1],
      })

      await user.click(screen.getByRole('button', { name: 'Select user' }))

      expect(emitted().select).toEqual([[user1]])
    })

    it('emits null when the selection is cleared', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({
        ...defaultProps,
        searchResults: [user1],
      })

      await user.click(screen.getByRole('button', { name: 'Clear selection' }))

      expect(emitted().select).toEqual([[null]])
    })

    it('shows a duplicate entry dialog and emits null when the user is already added', async () => {
      const user = userEvent.setup()

      const currentUser = makeUser({
        ssoUser: makeSsoUser({
          ssoUserId: user1.ssoUser.ssoUserId,
        }),
      })

      const { emitted } = renderComponent({
        ...defaultProps,
        currentUsers: [currentUser],
        searchResults: [user1, user2],
      })

      await user.click(screen.getByRole('button', { name: 'Select user' }))

      expect(
        screen.getByText('The selected user is already added to this tenant.'),
      ).toBeInTheDocument()

      expect(emitted().select).toEqual([[null]])
    })

    it('closes the duplicate entry dialog when OK is clicked', async () => {
      const user = userEvent.setup()

      const currentUser = makeUser({
        ssoUser: makeSsoUser({
          ssoUserId: user1.ssoUser.ssoUserId,
        }),
      })

      renderComponent({
        ...defaultProps,
        currentUsers: [currentUser],
        searchResults: [user1],
      })

      await user.click(screen.getByRole('button', { name: 'Select user' }))

      expect(screen.getByText('Duplicate Entry')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'OK' }))

      await waitFor(() =>
        expect(screen.getByText('Duplicate Entry')).not.toBeVisible(),
      )
    })
  })
})
