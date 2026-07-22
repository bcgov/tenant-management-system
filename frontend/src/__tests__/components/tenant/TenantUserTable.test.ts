import { fireEvent, render, screen } from '@testing-library/vue'
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
  makeTenant,
  makeUser,
} from '@/__tests__/__factories__'
import { isVuetifyDisabled } from '@/__tests__/__helpers__/vuetify'

import TenantUserTable from '@/components/tenant/TenantUserTable.vue'
import { type Tenant } from '@/models/tenant.model'
import { toUserId, type User } from '@/models/user.model'
import { currentUserHasRole } from '@/utils/permissions'

vi.mock('@/utils/identityProvider', () => ({
  identityProviderToDisplay: vi.fn((idpType: string) => idpType),
}))

vi.mock('@/utils/permissions', () => ({
  currentUserHasRole: vi.fn(),
}))

vi.mock('@/components/tenant/RoleDialog.vue', () => ({
  default: {
    emits: ['update:open-dialog'],
    name: 'RoleDialog',
    props: ['modelValue', 'tenant', 'userIndex'],
    template:
      '<div v-if="modelValue" data-testid="role-dialog">' +
      'Editing user index: {{ userIndex }}' +
      '<button data-testid="close-role-dialog" ' +
      '@click="$emit(\'update:open-dialog\', false)">Close</button>' +
      '<button data-testid="dismiss-role-dialog" ' +
      '@click="$emit(\'update:modelValue\', false)">Dismiss</button>' +
      '</div>',
  },
}))

const vuetify = createVuetify({ components, directives })

function renderComponent(props: { tenant: Tenant; users: User[] }) {
  return render(TenantUserTable, {
    global: {
      plugins: [vuetify],
    },
    props,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TenantUserTable', () => {
  describe('Actions column', () => {
    it('is displayed for admins', () => {
      const user = makeUser({
        ssoUser: makeSsoUser({ firstName: 'firstName', lastName: 'lastName' }),
      })
      const tenant = makeTenant({ users: [user] })
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ tenant, users: [user] })

      expect(
        screen.getByRole('columnheader', { name: 'Actions' }),
      ).toBeInTheDocument()
      expect(
        screen.getByLabelText('Open Menu for firstName lastName'),
      ).toBeInTheDocument()
    })

    it('is not displayed for non-admins', () => {
      const user = makeUser({
        ssoUser: makeSsoUser({ firstName: 'firstName', lastName: 'lastName' }),
      })
      const tenant = makeTenant({ users: [user] })
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      renderComponent({ tenant, users: [user] })

      expect(
        screen.queryByRole('columnheader', { name: 'Actions' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByLabelText('Open Menu for firstName lastName'),
      ).not.toBeInTheDocument()
    })
  })

  describe('Table data', () => {
    it("renders a row with each user's details", () => {
      vi.mocked(currentUserHasRole).mockReturnValue(false)

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
      const tenant = makeTenant({ users })

      renderComponent({ tenant, users })

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
      const tenant = makeTenant({ users })
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      renderComponent({ tenant, users })
      await fireEvent.update(screen.getByLabelText('Search'), 'Alice')

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.queryByText('Bob')).not.toBeInTheDocument()
    })

    it('shows a no-data message when the search filter matches no users', async () => {
      const user = makeUser({
        ssoUser: makeSsoUser({
          email: 'firstName.lastName@gov.bc.ca',
          firstName: 'firstName',
          lastName: 'lastName',
        }),
      })
      const tenant = makeTenant({ users: [user] })
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      renderComponent({ tenant, users: [user] })
      await fireEvent.update(screen.getByLabelText('Search'), 'no-such-user')

      expect(
        screen.getByText('No users match your search criteria'),
      ).toBeInTheDocument()
      expect(screen.queryByText('firstName')).not.toBeInTheDocument()
    })
  })

  describe('Tenant Roles column', () => {
    it('renders a chip per role, sorted by description', () => {
      const user = makeUser({
        roles: [
          makeRole({ description: 'User Role' }),
          makeRole({ description: 'Admin Role' }),
        ],
      })
      const tenant = makeTenant({ users: [user] })
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      renderComponent({ tenant, users: [user] })

      const chips = screen.getAllByText(/Role$/)
      expect(chips.map((el) => el.textContent?.trim())).toEqual([
        'Admin Role',
        'User Role',
      ])
    })

    it('does not show a remove icon for non-admins', () => {
      const user = makeUser({
        roles: [makeRoleServiceUser()],
      })
      const tenant = makeTenant({ users: [user] })
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      renderComponent({ tenant, users: [user] })

      expect(screen.queryByLabelText(/Remove Role/)).not.toBeInTheDocument()
    })

    it('does not show a remove icon when the user has only one role', () => {
      const user = makeUser({
        roles: [makeRoleServiceUser()],
      })
      const tenant = makeTenant({ users: [user] })
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ tenant, users: [user] })

      expect(screen.queryByLabelText(/Remove Role/)).not.toBeInTheDocument()
    })

    it('does not show a remove icon for the Tenant Owner role when there is only one owner', () => {
      const owner = makeRoleTenantOwner()
      const service = makeRoleServiceUser()
      const user = makeUser({
        roles: [service, owner],
      })
      const tenant = makeTenant({ users: [user] })
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ tenant, users: [user] })

      expect(
        screen.queryByLabelText(`Remove Role ${owner.description}`),
      ).not.toBeInTheDocument()
      expect(
        screen.getByLabelText(`Remove Role ${service.description}`),
      ).toBeInTheDocument()
    })

    it('shows a remove icon for the Tenant Owner role when there are multiple owners', () => {
      const owner = makeRoleTenantOwner()
      const userA = makeUser({
        roles: [owner, makeRoleServiceUser()],
      })
      const userB = makeUser({
        roles: [owner],
      })
      const tenant = makeTenant({ users: [userA, userB] })
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ tenant, users: [userA, userB] })

      expect(
        screen.getAllByLabelText(`Remove Role ${owner.description}`).length,
      ).toBeGreaterThan(0)
    })
  })

  describe('Remove role event', () => {
    it('is emitted after confirming', async () => {
      const role = makeRoleServiceUser()
      const user = makeUser({
        roles: [role, makeRoleUserAdmin()],
      })
      const tenant = makeTenant({ users: [user] })
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const { emitted } = renderComponent({ tenant, users: [user] })

      await fireEvent.click(
        screen.getByLabelText(`Remove Role ${role.description}`),
      )
      expect(screen.getByText('Confirm Role Removal')).toBeInTheDocument()

      await fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

      expect(emitted()['remove-role']).toHaveLength(1)
      expect(emitted()['remove-role'][0]).toEqual([user, role])
    })

    it('is not emitted after cancelling', async () => {
      const role = makeRoleServiceUser()
      const user = makeUser({
        roles: [role, makeRoleUserAdmin()],
      })
      const tenant = makeTenant({ users: [user] })
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const { emitted } = renderComponent({ tenant, users: [user] })

      await fireEvent.click(
        screen.getByLabelText(`Remove Role ${role.description}`),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(emitted()['remove-role']).toBeUndefined()
    })
  })

  describe('Offboard User action', () => {
    it('is enabled when there are multiple tenant owners', async () => {
      const userA = makeUser({
        roles: [makeRoleTenantOwner()],
        ssoUser: makeSsoUser({
          firstName: 'firstNameA',
          lastName: 'lastNameA',
        }),
      })
      const userB = makeUser({
        roles: [makeRoleTenantOwner()],
        ssoUser: makeSsoUser({
          firstName: 'firstNameB',
          lastName: 'lastNameB',
        }),
      })
      const tenant = makeTenant({ users: [userA, userB] })
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ tenant, users: [userA, userB] })
      await fireEvent.click(
        screen.getByLabelText('Open Menu for firstNameA lastNameA'),
      )

      const offboardItem = screen.getByLabelText(
        'Offboard User firstNameA lastNameA',
      )
      expect(isVuetifyDisabled(offboardItem)).toBe(false)
    })

    it('is disabled when the user is the sole tenant owner', async () => {
      const user = makeUser({
        roles: [makeRoleTenantOwner()],
        ssoUser: makeSsoUser({
          firstName: 'firstName',
          lastName: 'lastName',
        }),
      })
      const tenant = makeTenant({ users: [user] })
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ tenant, users: [user] })
      await fireEvent.click(
        screen.getByLabelText('Open Menu for firstName lastName'),
      )

      const offboardItem = screen.getByLabelText(
        'Offboard User firstName lastName',
      )
      expect(isVuetifyDisabled(offboardItem)).toBe(true)
    })

    it('emits remove-user after confirming', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const user = makeUser({
        roles: [makeRoleUserAdmin()],
        ssoUser: makeSsoUser({ firstName: 'firstName', lastName: 'lastName' }),
      })
      const tenant = makeTenant({ users: [user] })

      const { emitted } = renderComponent({ tenant, users: [user] })

      await fireEvent.click(
        screen.getByLabelText('Open Menu for firstName lastName'),
      )
      await fireEvent.click(await screen.findByText('Offboard User'))
      expect(screen.getByText('Offboarding User')).toBeInTheDocument()

      await fireEvent.click(
        screen.getByRole('button', { name: 'Offboard User' }),
      )

      expect(emitted()['remove-user']).toHaveLength(1)
      expect(emitted()['remove-user'][0]).toEqual([user])
    })

    it('does not emit remove-user after cancelling', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const user = makeUser({
        roles: [makeRoleUserAdmin()],
        ssoUser: makeSsoUser({ firstName: 'firstName', lastName: 'lastName' }),
      })
      const tenant = makeTenant({ users: [user] })

      const { emitted } = renderComponent({ tenant, users: [user] })

      await fireEvent.click(
        screen.getByLabelText('Open Menu for firstName lastName'),
      )
      await fireEvent.click(await screen.findByText('Offboard User'))
      await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(emitted()['remove-user']).toBeUndefined()
    })
  })

  describe('Edit Tenant Roles action', () => {
    it('opens the RoleDialog for the selected user', async () => {
      const userA = makeUser({
        id: toUserId('a'),
        roles: [makeRoleTenantOwner()],
        ssoUser: makeSsoUser({
          firstName: 'firstNameA',
          lastName: 'lastNameA',
        }),
      })
      const userB = makeUser({
        id: toUserId('b'),
        roles: [makeRoleUserAdmin()],
        ssoUser: makeSsoUser({
          firstName: 'firstNameB',
          lastName: 'lastNameB',
        }),
      })
      const tenant = makeTenant({ users: [userA, userB] })
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ tenant, users: [userA, userB] })
      await fireEvent.click(
        screen.getByLabelText('Open Menu for firstNameB lastNameB'),
      )
      await fireEvent.click(
        screen.getByLabelText('Edit Tenant Roles for firstNameB lastNameB'),
      )

      expect(screen.getByTestId('role-dialog')).toHaveTextContent(
        'Editing user index: 1',
      )
    })

    it('closes the dialog and clears the modifying user index', async () => {
      const userA = makeUser({
        id: toUserId('user-a'),
        roles: [makeRoleTenantOwner()],
        ssoUser: makeSsoUser({
          firstName: 'firstNameA',
          lastName: 'lastNameA',
        }),
      })
      const userB = makeUser({
        id: toUserId('user-b'),
        roles: [makeRoleUserAdmin()],
        ssoUser: makeSsoUser({
          firstName: 'firstNameB',
          lastName: 'lastNameB',
        }),
      })
      const tenant = makeTenant({ users: [userA, userB] })
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ tenant, users: [userA, userB] })

      // Open the dialog for userB (index 1)
      await fireEvent.click(
        screen.getByLabelText('Open Menu for firstNameB lastNameB'),
      )
      await fireEvent.click(
        screen.getByLabelText('Edit Tenant Roles for firstNameB lastNameB'),
      )
      expect(screen.getByTestId('role-dialog')).toHaveTextContent(
        'Editing user index: 1',
      )

      await fireEvent.click(screen.getByTestId('close-role-dialog'))
      expect(screen.queryByTestId('role-dialog')).not.toBeInTheDocument()

      await fireEvent.click(
        screen.getByLabelText('Open Menu for firstNameA lastNameA'),
      )
      await fireEvent.click(
        screen.getByLabelText('Edit Tenant Roles for firstNameA lastNameA'),
      )
      expect(screen.getByTestId('role-dialog')).toHaveTextContent(
        'Editing user index: 0',
      )
    })

    it('closes via v-model when the dialog dismisses itself', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const user = makeUser({
        roles: [makeRoleTenantOwner()],
        ssoUser: makeSsoUser({ firstName: 'firstName', lastName: 'lastName' }),
      })
      const tenant = makeTenant({ users: [user] })

      renderComponent({ tenant, users: [user] })

      await fireEvent.click(
        screen.getByLabelText('Open Menu for firstName lastName'),
      )
      await fireEvent.click(await screen.findByText('Edit Tenant Roles'))
      expect(screen.getByTestId('role-dialog')).toBeInTheDocument()

      await fireEvent.click(screen.getByTestId('dismiss-role-dialog'))

      expect(screen.queryByTestId('role-dialog')).not.toBeInTheDocument()
    })
  })
})
