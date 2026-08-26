import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'

import { makeSsoUser, makeTenant, makeUser } from '@/__tests__/__factories__'

import UserSearchTable from '@/components/user/UserSearchTable.vue'
import { toUserId } from '@/models/user.model'
import vuetify from '@/plugins/vuetify'

vi.mock('@/utils/identityProvider', () => ({
  identityProviderToDisplay: vi.fn((idpType: string) => idpType),
}))

const mockTenant = makeTenant()

const user1 = makeUser({
  id: toUserId('userId1'),
  ssoUser: makeSsoUser({
    email: 'ssoUserEmail1',
    firstName: 'ssoUserFirstName1',
    idpType: 'ssoUserIdpType1',
    lastName: 'ssoUserLastName1',
  }),
})

const user2 = makeUser({
  id: toUserId('userId2'),
  ssoUser: makeSsoUser({
    email: 'ssoUserEmail2',
    firstName: 'ssoUserFirstName2',
    idpType: 'ssoUserIdpType2',
    lastName: 'ssoUserLastName2',
  }),
})

const defaultProps = {
  sortBy: 'ssoUser.lastName',
  tenant: mockTenant,
  users: [user1, user2],
}

const renderComponent = (props = defaultProps) => {
  return render(UserSearchTable, {
    props,
    global: {
      plugins: [vuetify],
    },
  })
}

describe('UserSearchTable', () => {
  describe('headers', () => {
    it('renders the column headers', () => {
      renderComponent()

      expect(
        screen.getByRole('columnheader', { name: 'First Name' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('columnheader', { name: 'Last Name' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('columnheader', { name: 'Email' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('columnheader', { name: 'Identity Provider' }),
      ).toBeInTheDocument()
    })
  })

  describe('rows', () => {
    it("renders each user's sso details in their own row", () => {
      renderComponent()

      const row = screen.getByRole('row', { name: /ssoUserFirstName1/ })
      expect(within(row).getByText('ssoUserFirstName1')).toBeInTheDocument()
      expect(within(row).getByText('ssoUserLastName1')).toBeInTheDocument()
      expect(within(row).getByText('ssoUserEmail1')).toBeInTheDocument()
    })

    it('renders a separate row for each user', () => {
      renderComponent()

      expect(
        screen.getByRole('row', { name: /ssoUserFirstName1/ }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('row', { name: /ssoUserFirstName2/ }),
      ).toBeInTheDocument()
    })

    it("renders each user's mapped identity provider label", () => {
      renderComponent()

      const rowA = screen.getByRole('row', { name: /ssoUserFirstName1/ })
      expect(within(rowA).getByText('ssoUserIdpType1')).toBeInTheDocument()

      const rowB = screen.getByRole('row', { name: /ssoUserFirstName2/ })
      expect(within(rowB).getByText('ssoUserIdpType2')).toBeInTheDocument()
    })

    it('shows a no-data message when there are no users', () => {
      renderComponent({ ...defaultProps, users: [] })

      expect(
        screen.getByText('No users match your search criteria'),
      ).toBeInTheDocument()
    })
  })

  describe('row selection', () => {
    it('emits the user on row-clicked when a row is clicked', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      const row = screen.getByRole('row', { name: /ssoUserFirstName1/ })
      await user.click(within(row).getByText('ssoUserFirstName1'))

      await waitFor(() => expect(emitted()['row-clicked']).toHaveLength(1))
      expect(emitted()['row-clicked'][0]).toEqual([user1])
    })

    it('emits null on row-clicked when the selected row is clicked again', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      const row = screen.getByRole('row', { name: /ssoUserFirstName1/ })
      const nameCell = within(row).getByText('ssoUserFirstName1')

      await user.click(nameCell)
      await waitFor(() => expect(emitted()['row-clicked']).toHaveLength(1))

      await user.click(nameCell)
      await waitFor(() => expect(emitted()['row-clicked']).toHaveLength(2))
      expect(emitted()['row-clicked'][1]).toEqual([null])
    })

    it('replaces the selection when a different row is clicked', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent()

      const rowA = screen.getByRole('row', { name: /ssoUserFirstName1/ })
      await user.click(within(rowA).getByText('ssoUserFirstName1'))
      await waitFor(() => expect(emitted()['row-clicked']).toHaveLength(1))

      const rowB = screen.getByRole('row', { name: /ssoUserFirstName2/ })
      await user.click(within(rowB).getByText('ssoUserFirstName2'))

      await waitFor(() => expect(emitted()['row-clicked']).toHaveLength(2))
      expect(emitted()['row-clicked'][1]).toEqual([user2])
    })
  })

  describe('v-model selection state', () => {
    it('selects a user when its checkbox is clicked', async () => {
      const user = userEvent.setup()
      renderComponent()

      const row = screen.getByRole('row', { name: /ssoUserFirstName1/ })

      await user.click(within(row).getByRole('checkbox'))

      await waitFor(() =>
        expect(within(row).getByRole('checkbox')).toBeChecked(),
      )
    })

    it('checks the row checkbox when the row is selected', async () => {
      const user = userEvent.setup()
      renderComponent()

      const row = screen.getByRole('row', { name: /ssoUserFirstName1/ })
      await user.click(within(row).getByText('ssoUserFirstName1'))

      await waitFor(() =>
        expect(within(row).getByRole('checkbox')).toBeChecked(),
      )
    })

    it('unchecks the row checkbox when the row is deselected', async () => {
      const user = userEvent.setup()
      renderComponent()

      const row = screen.getByRole('row', { name: /ssoUserFirstName1/ })
      const nameCell = within(row).getByText('ssoUserFirstName1')

      await user.click(nameCell)
      await waitFor(() =>
        expect(within(row).getByRole('checkbox')).toBeChecked(),
      )

      await user.click(nameCell)
      await waitFor(() =>
        expect(within(row).getByRole('checkbox')).not.toBeChecked(),
      )
    })

    it('unchecks the previous row when a different row is selected', async () => {
      const user = userEvent.setup()
      renderComponent()

      const row1 = screen.getByRole('row', { name: /ssoUserFirstName1/ })
      await user.click(within(row1).getByText('ssoUserFirstName1'))
      await waitFor(() =>
        expect(within(row1).getByRole('checkbox')).toBeChecked(),
      )

      const row2 = screen.getByRole('row', { name: /ssoUserFirstName2/ })
      await user.click(within(row2).getByText('ssoUserFirstName2'))

      await waitFor(() =>
        expect(within(row2).getByRole('checkbox')).toBeChecked(),
      )
      expect(within(row1).getByRole('checkbox')).not.toBeChecked()
    })
  })
})
