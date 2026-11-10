import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import {
  makeRole,
  makeRoleServiceUser,
  makeRoleTenantOwner,
  makeRoleUserAdmin,
  makeSsoUser,
  makeUser,
  makeUserIdir,
} from '@/__tests__/__factories__'
import { isVuetifyDisabled } from '@/__tests__/__helpers__/vuetify'

import TenantUserTable from '@/components/tenant/TenantUserTable.vue'
import { toUserId, type User } from '@/models/user.model'

vi.mock('@/components/tenant/RoleDialog.vue', () => ({
  default: {
    emits: ['update:modelValue', 'roles-changed'],
    name: 'RoleDialog',
    props: ['modelValue', 'roles', 'user'],
    template:
      '<div v-if="modelValue" data-testid="role-dialog">' +
      '{{ user.ssoUser.firstName }} {{ user.ssoUser.lastName }}' +
      '<button data-testid="close-role-dialog" ' +
      '@click="$emit(\'update:modelValue\', false)">Close</button>' +
      '<button data-testid="change-roles-dialog" ' +
      "@click=\"$emit('roles-changed', user, ['role-2', 'role-3'], ['role-1'])\">" +
      'Change</button>' +
      '</div>',
  },
}))

const vuetify = createVuetify({ components, directives })

function renderComponent(props: { isUserAdmin: boolean; users: User[] }) {
  return render(TenantUserTable, {
    global: {
      plugins: [vuetify],
    },
    props: {
      ...props,
      roles: [
        makeRoleServiceUser(),
        makeRoleTenantOwner(),
        makeRoleUserAdmin(),
      ],
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TenantUserTable', () => {
  describe('Actions column', () => {
    it('is displayed for user admin', () => {
      const users = [
        makeUserIdir({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: true, users })

      expect(
        screen.getByRole('columnheader', { name: 'Actions' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: 'Open menu for firstName lastName',
        }),
      ).toBeInTheDocument()
    })

    it('is not displayed for not user admin', () => {
      const users = [
        makeUserIdir({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: false, users })

      expect(
        screen.queryByRole('columnheader', { name: 'Actions' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', {
          name: 'Open menu for firstName lastName',
        }),
      ).not.toBeInTheDocument()
    })
  })

  describe('Table data', () => {
    it("renders a row with each user's details", () => {
      const users = [
        makeUser({
          roles: [makeRoleServiceUser()],
          ssoUser: makeSsoUser({
            email: 'email1',
            firstName: 'firstName1',
            idpType: 'idp1',
            lastName: 'lastName1',
          }),
        }),
        makeUser({
          roles: [makeRoleServiceUser()],
          ssoUser: makeSsoUser({
            email: 'email2',
            firstName: 'firstName2',
            idpType: 'idp2',
            lastName: 'lastName2',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: false, users })

      expect(screen.getByText('email1')).toBeInTheDocument()
      expect(screen.getByText('firstName1')).toBeInTheDocument()
      expect(screen.getByText('idp1')).toBeInTheDocument()
      expect(screen.getByText('lastName1')).toBeInTheDocument()
      expect(screen.getByText('email2')).toBeInTheDocument()
      expect(screen.getByText('firstName2')).toBeInTheDocument()
      expect(screen.getByText('idp2')).toBeInTheDocument()
      expect(screen.getByText('lastName2')).toBeInTheDocument()
    })

    it('filters rows based on the search input', async () => {
      const user = userEvent.setup()
      const users = [
        makeUser({
          ssoUser: makeSsoUser({
            email: 'alice@example.com',
            firstName: 'Alice',
            lastName: 'Anderson',
          }),
        }),
        makeUser({
          ssoUser: makeSsoUser({
            email: 'bob@example.com',
            firstName: 'Bob',
            lastName: 'Barker',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: false, users })

      expect(screen.getByText('Anderson')).toBeInTheDocument()
      expect(screen.getByText('Barker')).toBeInTheDocument()

      await user.type(screen.getByLabelText('Search'), 'Alice')

      expect(screen.getByText('Anderson')).toBeInTheDocument()
      expect(screen.queryByText('Barker')).not.toBeInTheDocument()
    })

    it('shows a no-data message when the search filter matches no users', async () => {
      const user = userEvent.setup()
      const users = [
        makeUser({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: false, users })

      expect(screen.getByText('firstName')).toBeInTheDocument()

      await user.type(screen.getByLabelText('Search'), 'no-such-user')

      expect(
        screen.getByText('No users match your search criteria'),
      ).toBeInTheDocument()
      expect(screen.queryByText('firstName')).not.toBeInTheDocument()
    })

    it('clears the search when clear button is clicked', async () => {
      const user = userEvent.setup()
      const users = [
        makeUser({
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: false, users })
      const searchInput = screen.getByLabelText('Search')
      await user.type(searchInput, 'no-such-user')

      expect(
        screen.getByText('No users match your search criteria'),
      ).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Clear search' }))

      expect(
        screen.queryByText('No users match your search criteria'),
      ).not.toBeInTheDocument()
      expect(searchInput).toHaveValue('')
      expect(searchInput).toHaveFocus()
    })
  })

  describe('Tenant Roles column', () => {
    it('renders a chip per role, sorted by description', () => {
      const users = [
        makeUser({
          roles: [
            makeRole({ description: 'User Role' }),
            makeRole({ description: 'Admin Role' }),
          ],
        }),
      ]

      renderComponent({ isUserAdmin: false, users })

      expect(screen.getByText('Admin Role')).toBeInTheDocument()
      expect(screen.getByText('User Role')).toBeInTheDocument()
    })

    it('has remove owner icon for user admin when multiple owners', () => {
      const roleTenantOwner = makeRoleTenantOwner()
      const users = [
        makeUserIdir({
          roles: [roleTenantOwner, makeRoleServiceUser()],
          ssoUser: makeSsoUser({
            firstName: 'firstNameA',
            lastName: 'lastNameA',
          }),
        }),
        makeUserIdir({
          roles: [roleTenantOwner, makeRoleServiceUser()],
          ssoUser: makeSsoUser({
            firstName: 'firstNameB',
            lastName: 'lastNameB',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: true, users })

      expect(
        screen.getByLabelText(
          `Remove role ${roleTenantOwner.description} for firstNameA lastNameA`,
        ),
      ).toBeInTheDocument()
    })

    it('has no remove owner icon non-user admin when multiple owners', () => {
      const roleTenantOwner = makeRoleTenantOwner()
      const users = [
        makeUserIdir({
          roles: [roleTenantOwner, makeRoleServiceUser()],
          ssoUser: makeSsoUser({
            firstName: 'firstNameA',
            lastName: 'lastNameA',
          }),
        }),
        makeUserIdir({
          roles: [roleTenantOwner, makeRoleServiceUser()],
          ssoUser: makeSsoUser({
            firstName: 'firstNameB',
            lastName: 'lastNameB',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: false, users })

      expect(
        screen.queryByLabelText(
          `Remove role ${roleTenantOwner.description} for firstNameA lastNameA`,
        ),
      ).not.toBeInTheDocument()
    })

    it('has no remove icon when only one tenant owner', () => {
      const roleTenantOwner = makeRoleTenantOwner()
      const users = [
        makeUserIdir({
          roles: [roleTenantOwner, makeRoleServiceUser()],
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: false, users })

      expect(
        screen.queryByLabelText(
          `Remove role ${roleTenantOwner.description} for firstName lastName`,
        ),
      ).not.toBeInTheDocument()
    })
  })

  describe('Remove role event', () => {
    it('is emitted after confirming', async () => {
      const user = userEvent.setup()
      const role = makeRoleServiceUser()
      const users = [
        makeUserIdir({
          roles: [role, makeRoleUserAdmin()],
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      ]

      const { emitted } = renderComponent({ isUserAdmin: true, users })
      await user.click(
        screen.getByLabelText(
          `Remove role ${role.description} for firstName lastName`,
        ),
      )

      expect(screen.getByText('Confirm role removal')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Remove role' }))

      expect(emitted()['remove-role']).toHaveLength(1)
      expect(emitted()['remove-role'][0]).toEqual([users[0], role])
    })

    it('is not emitted after cancelling', async () => {
      const user = userEvent.setup()
      const role = makeRoleServiceUser()
      const users = [
        makeUserIdir({
          roles: [role, makeRoleUserAdmin()],
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      ]

      const { emitted } = renderComponent({ isUserAdmin: true, users })

      await user.click(
        screen.getByLabelText(
          `Remove role ${role.description} for firstName lastName`,
        ),
      )
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(emitted()['remove-role']).toBeUndefined()
    })
  })

  describe('Remove user action', () => {
    it('is enabled when there are multiple tenant owners', async () => {
      const user = userEvent.setup()
      const users = [
        makeUserIdir({
          roles: [makeRoleTenantOwner()],
          ssoUser: makeSsoUser({
            firstName: 'firstNameA',
            lastName: 'lastNameA',
          }),
        }),
        makeUserIdir({
          roles: [makeRoleTenantOwner()],
          ssoUser: makeSsoUser({
            firstName: 'firstNameB',
            lastName: 'lastNameB',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: true, users: users })
      await user.click(
        screen.getByLabelText('Open menu for firstNameA lastNameA'),
      )

      const removeItem = screen.getByLabelText(
        'Remove user firstNameA lastNameA',
      )
      expect(isVuetifyDisabled(removeItem)).toBe(false)
    })

    it('is disabled when the user is the sole tenant owner', async () => {
      const user = userEvent.setup()
      const users = [
        makeUserIdir({
          roles: [makeRoleTenantOwner()],
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: true, users })
      await user.click(
        screen.getByLabelText('Open menu for firstName lastName'),
      )

      const removeItem = screen.getByLabelText('Remove user firstName lastName')
      expect(isVuetifyDisabled(removeItem)).toBe(true)
    })

    it('emits remove-user after confirming', async () => {
      const user = userEvent.setup()
      const users = [
        makeUserIdir({
          roles: [makeRoleUserAdmin()],
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      ]

      const { emitted } = renderComponent({ isUserAdmin: true, users })
      await user.click(
        screen.getByLabelText('Open menu for firstName lastName'),
      )
      await user.click(await screen.findByText('Remove user'))
      await user.click(screen.getByRole('button', { name: 'Remove user' }))

      expect(emitted()['remove-user']).toHaveLength(1)
      expect(emitted()['remove-user'][0]).toEqual(users)
    })

    it('does not emit remove-user after cancelling', async () => {
      const user = userEvent.setup()
      const users = [
        makeUserIdir({
          roles: [makeRoleUserAdmin()],
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      ]

      const { emitted } = renderComponent({ isUserAdmin: true, users })
      await user.click(
        screen.getByLabelText('Open menu for firstName lastName'),
      )
      await user.click(await screen.findByText('Remove user'))
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(emitted()['remove-user']).toBeUndefined()
    })
  })

  describe('Edit Tenant Roles action', () => {
    it('opens the RoleDialog for the selected user', async () => {
      const user = userEvent.setup()
      const users = [
        makeUserIdir({
          roles: [makeRoleTenantOwner()],
          ssoUser: makeSsoUser({
            firstName: 'firstNameA',
            lastName: 'lastNameA',
          }),
        }),
        makeUserIdir({
          roles: [makeRoleUserAdmin()],
          ssoUser: makeSsoUser({
            firstName: 'firstNameB',
            lastName: 'lastNameB',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: true, users })
      await user.click(
        screen.getByLabelText('Open menu for firstNameB lastNameB'),
      )
      await user.click(
        screen.getByLabelText('Edit tenant roles for firstNameB lastNameB'),
      )

      expect(screen.getByTestId('role-dialog')).toHaveTextContent(
        'firstNameB lastNameB',
      )
    })

    it('closes the dialog and changes the modifying user', async () => {
      const user = userEvent.setup()
      const users = [
        makeUserIdir({
          roles: [makeRoleTenantOwner()],
          ssoUser: makeSsoUser({
            firstName: 'firstNameA',
            lastName: 'lastNameA',
          }),
        }),
        makeUserIdir({
          roles: [makeRoleUserAdmin()],
          ssoUser: makeSsoUser({
            firstName: 'firstNameB',
            lastName: 'lastNameB',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: true, users })

      await user.click(
        screen.getByLabelText('Open menu for firstNameB lastNameB'),
      )
      await user.click(
        screen.getByLabelText('Edit tenant roles for firstNameB lastNameB'),
      )
      expect(screen.getByTestId('role-dialog')).toHaveTextContent(
        'firstNameB lastNameB',
      )

      await user.click(screen.getByTestId('close-role-dialog'))
      expect(screen.queryByTestId('role-dialog')).not.toBeInTheDocument()

      await user.click(
        screen.getByLabelText('Open menu for firstNameA lastNameA'),
      )
      await user.click(
        screen.getByLabelText('Edit tenant roles for firstNameA lastNameA'),
      )
      expect(screen.getByTestId('role-dialog')).toHaveTextContent(
        'firstNameA lastNameA',
      )
    })

    it('closes via v-model when the dialog dismisses itself', async () => {
      const user = userEvent.setup()
      const users = [
        makeUserIdir({
          roles: [makeRoleTenantOwner()],
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      ]

      renderComponent({ isUserAdmin: true, users })
      await user.click(
        screen.getByLabelText('Open menu for firstName lastName'),
      )
      await user.click(await screen.findByText('Edit tenant roles'))

      expect(screen.getByTestId('role-dialog')).toBeInTheDocument()

      await user.click(screen.getByTestId('close-role-dialog'))

      expect(screen.queryByTestId('role-dialog')).not.toBeInTheDocument()
    })

    it('emits roles-changed with the edited user and both role lists', async () => {
      const user = userEvent.setup()
      const users = [
        makeUserIdir({
          roles: [makeRoleTenantOwner()],
          ssoUser: makeSsoUser({
            firstName: 'firstNameA',
            lastName: 'lastNameA',
          }),
        }),
        makeUserIdir({
          id: toUserId('b'),
          roles: [makeRoleUserAdmin()],
          ssoUser: makeSsoUser({
            firstName: 'firstNameB',
            lastName: 'lastNameB',
          }),
        }),
      ]

      const { emitted } = renderComponent({ isUserAdmin: true, users })
      await user.click(
        screen.getByLabelText('Open menu for firstNameB lastNameB'),
      )
      await user.click(
        screen.getByLabelText('Edit tenant roles for firstNameB lastNameB'),
      )
      await user.click(screen.getByTestId('change-roles-dialog'))

      expect(emitted()['roles-changed']).toHaveLength(1)
      expect(emitted()['roles-changed'][0]).toEqual([
        users[1],
        ['role-2', 'role-3'],
        ['role-1'],
      ])
    })

    it('does not emit roles-changed just by opening the dialog', async () => {
      const user = userEvent.setup()
      const users = [
        makeUserIdir({
          roles: [makeRoleUserAdmin()],
          ssoUser: makeSsoUser({
            firstName: 'firstName',
            lastName: 'lastName',
          }),
        }),
      ]

      const { emitted } = renderComponent({ isUserAdmin: true, users })
      await user.click(
        screen.getByLabelText('Open menu for firstName lastName'),
      )
      await user.click(
        screen.getByLabelText('Edit tenant roles for firstName lastName'),
      )

      expect(screen.getByTestId('role-dialog')).toBeInTheDocument()
      expect(emitted()['roles-changed']).toBeUndefined()
    })
  })
})
