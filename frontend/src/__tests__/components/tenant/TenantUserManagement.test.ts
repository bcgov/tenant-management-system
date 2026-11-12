import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import {
  makeGroup,
  makeRole,
  makeTenant,
  makeUser,
} from '@/__tests__/__factories__'

import TenantUserManagement from '@/components/tenant/TenantUserManagement.vue'
import { Group, toGroupId } from '@/models/group.model'
import { type Role, toRoleId } from '@/models/role.model'
import { type Tenant } from '@/models/tenant.model'
import { toUserId, type User } from '@/models/user.model'

const vuetify = createVuetify({ components, directives })

const tenantUserTableStub = {
  emits: ['remove-role', 'remove-user', 'roles-changed'],
  name: 'TenantUserTable',
  props: ['isUserAdmin', 'roles', 'users'],
  template: `
    <div>
      <button @click="$emit('remove-role', users[0], { id: 'roleId1' })">
        stub-remove-role
      </button>
      <button @click="$emit('remove-user', users[0])">stub-remove-user</button>
      <button @click="$emit('roles-changed', users[0], ['roleId2', 'roleId3'], ['roleId1'])">
        stub-roles-changed
      </button>
    </div>
  `,
}

const userSearchStub = {
  emits: ['clear-search', 'search', 'select'],
  name: 'UserSearch',
  props: ['currentUsers', 'loading', 'searchResults', 'tenant'],
  template: `
    <div>
      <button @click="$emit('search', 'email', 'text')">stub-search</button>
      <button @click="$emit('clear-search')">stub-clear-search</button>
      <button
        @click="$emit('select', { id: 'userId1', ssoUser: { idpType: 'azureidir' } })"
      >
        stub-select
      </button>
      <button
        @click="$emit('select', { id: 'userId1', ssoUser: { idpType: 'bceidbusiness' } })"
      >
        stub-select-bceid
      </button>
    </div>
  `,
}

function renderComponent(props: {
  allGroups?: Group[]
  allRoles?: Role[]
  isUserAdmin?: boolean
  loadingSearch?: boolean
  searchResults?: User[] | null
  tenant: Tenant
}) {
  return render(TenantUserManagement, {
    global: {
      plugins: [vuetify],
      stubs: {
        TenantUserTable: tenantUserTableStub,
        UserSearch: userSearchStub,
      },
    },
    props: {
      allGroups: [],
      allRoles: [],
      isUserAdmin: false,
      loadingSearch: false,
      searchResults: null,
      ...props,
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TenantUserManagement', () => {
  describe('User table', () => {
    it('remove-user event is forwarded', async () => {
      const user = userEvent.setup()
      const users = [makeUser({ id: toUserId('userId1') })]

      const { emitted } = renderComponent({
        isUserAdmin: true,
        tenant: makeTenant({ users }),
      })

      await user.click(screen.getByRole('button', { name: 'stub-remove-user' }))

      expect(emitted()['remove-user']).toHaveLength(1)
      expect(emitted()['remove-user'][0]).toEqual(['userId1'])
    })

    it('remove-role event is forwarded', async () => {
      const user = userEvent.setup()
      const users = [makeUser({ id: toUserId('userId1') })]

      const { emitted } = renderComponent({
        isUserAdmin: true,
        tenant: makeTenant({ users }),
      })

      await user.click(screen.getByRole('button', { name: 'stub-remove-role' }))

      expect(emitted()['remove-role']).toHaveLength(1)
      expect(emitted()['remove-role'][0]).toEqual(['userId1', 'roleId1'])
    })

    it('add another user opens search', async () => {
      const user = userEvent.setup()

      renderComponent({ isUserAdmin: true, tenant: makeTenant() })

      expect(
        screen.queryByRole('button', { name: 'stub-search' }),
      ).not.toBeInTheDocument()

      await user.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )

      expect(
        screen.getByRole('button', { name: 'stub-search' }),
      ).toBeInTheDocument()
    })

    it('roles-changed event is forwarded with the user and both role lists', async () => {
      const user = userEvent.setup()
      const users = [makeUser({ id: toUserId('userId1') })]

      const { emitted } = renderComponent({
        isUserAdmin: true,
        tenant: makeTenant({ users }),
      })

      await user.click(
        screen.getByRole('button', { name: 'stub-roles-changed' }),
      )

      expect(emitted()['roles-changed']).toHaveLength(1)
      expect(emitted()['roles-changed'][0]).toEqual([
        users[0],
        ['roleId2', 'roleId3'],
        ['roleId1'],
      ])
    })
  })

  describe('Add another user button', () => {
    it('is hidden for non-admins', () => {
      renderComponent({ tenant: makeTenant() })

      expect(
        screen.queryByRole('button', { name: 'Add user to tenant' }),
      ).not.toBeInTheDocument()
    })

    it('is shown for admins', () => {
      renderComponent({ isUserAdmin: true, tenant: makeTenant() })

      expect(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      ).toBeInTheDocument()
    })

    it('is hidden for admins once search is open', async () => {
      const user = userEvent.setup()

      renderComponent({ isUserAdmin: true, tenant: makeTenant() })

      const button = screen.getByRole('button', { name: 'Add user to tenant' })
      expect(button).toBeInTheDocument()

      await user.click(button)

      expect(button).not.toBeInTheDocument()
    })
  })

  describe('Add user flow', () => {
    it('does not show the Add User button until a user is selected', async () => {
      const user = userEvent.setup()
      renderComponent({ isUserAdmin: true, tenant: makeTenant() })

      await user.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )

      expect(
        screen.queryByRole('button', { name: 'Add user' }),
      ).not.toBeInTheDocument()
    })

    it('disables Add User until a role is selected', async () => {
      const user = userEvent.setup()
      const role = makeRole({
        description: 'Role One',
        id: toRoleId('roleId1'),
      })

      renderComponent({
        allRoles: [role],
        isUserAdmin: true,
        tenant: makeTenant(),
      })
      await user.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await user.click(screen.getByRole('button', { name: 'stub-select' }))

      expect(screen.getByRole('button', { name: 'Add user' })).toBeDisabled()

      await user.click(screen.getByRole('checkbox', { name: 'Role One' }))

      expect(screen.getByRole('button', { name: 'Add user' })).toBeEnabled()
    })

    it('emits cancel and closes the search flow when cancelled', async () => {
      const user = userEvent.setup()

      const { emitted } = renderComponent({
        isUserAdmin: true,
        tenant: makeTenant(),
      })

      await user.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(emitted().cancel).toHaveLength(1)
      expect(
        screen.queryByRole('button', { name: 'stub-search' }),
      ).not.toBeInTheDocument()
    })

    it('shows the role assignment step with every role for an IDIR user', async () => {
      const user = userEvent.setup()
      const allRoles = [
        makeRole({ id: toRoleId('roleId1'), description: 'roleDescription1' }),
        makeRole({ id: toRoleId('roleId2'), description: 'roleDescription2' }),
      ]

      renderComponent({
        allRoles,
        isUserAdmin: true,
        tenant: makeTenant(),
      })

      await user.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await user.click(screen.getByRole('button', { name: 'stub-select' }))

      expect(
        screen.getByText('2. Assign role(s) to this user:'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', { name: 'roleDescription1' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', { name: 'roleDescription2' }),
      ).toBeInTheDocument()
    })

    it('shows the role assignment step with only the first role for a BCeID user', async () => {
      const user = userEvent.setup()
      const allRoles = [
        makeRole({ id: toRoleId('roleId1'), description: 'roleDescription1' }),
        makeRole({ id: toRoleId('roleId2'), description: 'roleDescription2' }),
      ]

      renderComponent({
        allRoles,
        isUserAdmin: true,
        tenant: makeTenant(),
      })

      await user.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await user.click(
        screen.getByRole('button', { name: 'stub-select-bceid' }),
      )

      expect(
        screen.getByText('2. Assign role(s) to this user:'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', { name: 'roleDescription1' }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('checkbox', { name: 'roleDescription2' }),
      ).not.toBeInTheDocument()
    })

    it('does not show the group assignment step when there are no groups', async () => {
      const user = userEvent.setup()
      renderComponent({ isUserAdmin: true, tenant: makeTenant() })

      await user.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await user.click(screen.getByRole('button', { name: 'stub-select' }))

      expect(
        screen.queryByText('3. Assign group(s) to this user:'),
      ).not.toBeInTheDocument()
    })

    it('shows the group assignment step when groups exist', async () => {
      const user = userEvent.setup()
      const allGroups = [
        makeGroup({ id: toGroupId('groupId1'), name: 'Group One' }),
      ]

      renderComponent({
        allGroups,
        isUserAdmin: true,
        tenant: makeTenant(),
      })

      await user.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await user.click(screen.getByRole('button', { name: 'stub-select' }))

      expect(
        screen.getByText('3. Assign group(s) to this user:'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', { name: 'Group One' }),
      ).toBeInTheDocument()
    })

    it('emits add with the selected user, roles, and groups; closes the search flow', async () => {
      const user = userEvent.setup()
      const allRoles = [
        makeRole({ id: toRoleId('roleId'), description: 'roleDescription' }),
      ]
      const allGroups = [
        makeGroup({ id: toGroupId('groupId'), name: 'groupName' }),
      ]

      const { emitted } = renderComponent({
        allRoles,
        allGroups,
        isUserAdmin: true,
        tenant: makeTenant(),
      })

      await user.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await user.click(screen.getByRole('button', { name: 'stub-select' }))
      await user.click(
        screen.getByRole('checkbox', { name: 'roleDescription' }),
      )
      await user.click(screen.getByRole('checkbox', { name: 'groupName' }))
      await user.click(screen.getByRole('button', { name: 'Add user' }))

      expect(emitted().add).toHaveLength(1)
      expect(emitted().add[0]).toEqual([
        {
          id: 'userId1',
          roles: [allRoles[0]],
          ssoUser: { idpType: 'azureidir' },
        },
        [allGroups[0]],
      ])

      expect(
        screen.queryByRole('button', { name: 'stub-search' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('Select all', () => {
    const allGroups = [
      makeGroup({ id: toGroupId('groupId1'), name: 'groupName1' }),
      makeGroup({ id: toGroupId('groupId2'), name: 'groupName2' }),
    ]
    const allRoles = [
      makeRole({ id: toRoleId('roleId1'), description: 'roleDescription1' }),
      makeRole({ id: toRoleId('roleId2'), description: 'roleDescription2' }),
    ]

    // DOM order: the roles "Select all" is rendered before the groups one.
    const roleSelectAll = () =>
      screen.getAllByRole('checkbox', { name: 'Select all' })[0]
    const groupSelectAll = () =>
      screen.getAllByRole('checkbox', { name: 'Select all' })[1]

    const openAddFlow = async () => {
      const user = userEvent.setup()
      await user.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await user.click(screen.getByRole('button', { name: 'stub-select' }))
    }

    describe('roles', () => {
      it('checks every role and enables Add User when checked', async () => {
        const user = userEvent.setup()
        renderComponent({
          allGroups,
          allRoles,
          isUserAdmin: true,
          tenant: makeTenant(),
        })
        await openAddFlow()

        expect(screen.getByRole('button', { name: 'Add user' })).toBeDisabled()

        await user.click(roleSelectAll())

        expect(
          screen.getByRole('checkbox', { name: 'roleDescription1' }),
        ).toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'roleDescription2' }),
        ).toBeChecked()
        expect(screen.getByRole('button', { name: 'Add user' })).toBeEnabled()
      })

      it('unchecks every role and disables Add User when unchecked', async () => {
        const user = userEvent.setup()
        renderComponent({
          allGroups,
          allRoles,
          isUserAdmin: true,
          tenant: makeTenant(),
        })
        await openAddFlow()

        await user.click(roleSelectAll())
        await user.click(roleSelectAll())

        expect(
          screen.getByRole('checkbox', { name: 'roleDescription1' }),
        ).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'roleDescription2' }),
        ).not.toBeChecked()
        expect(screen.getByRole('button', { name: 'Add user' })).toBeDisabled()
      })

      it('emits add with all roles when Select all is used', async () => {
        const user = userEvent.setup()
        const { emitted } = renderComponent({
          allGroups,
          allRoles,
          isUserAdmin: true,
          tenant: makeTenant(),
        })
        await openAddFlow()

        await user.click(roleSelectAll())
        await user.click(screen.getByRole('button', { name: 'Add user' }))

        expect(emitted().add).toHaveLength(1)
        expect(emitted().add[0]).toEqual([
          {
            id: 'userId1',
            roles: allRoles,
            ssoUser: { idpType: 'azureidir' },
          },
          [],
        ])
      })
    })

    describe('groups', () => {
      it('checks every group when checked', async () => {
        const user = userEvent.setup()
        renderComponent({
          allGroups,
          allRoles: [allRoles[0]],
          isUserAdmin: true,
          tenant: makeTenant(),
        })
        await openAddFlow()

        await user.click(groupSelectAll())

        expect(
          screen.getByRole('checkbox', { name: 'groupName1' }),
        ).toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'groupName2' }),
        ).toBeChecked()
      })

      it('unchecks every group when unchecked', async () => {
        const user = userEvent.setup()
        renderComponent({
          allGroups,
          allRoles: [allRoles[0]],
          isUserAdmin: true,
          tenant: makeTenant(),
        })
        await openAddFlow()

        await user.click(groupSelectAll())
        await user.click(groupSelectAll())

        expect(
          screen.getByRole('checkbox', { name: 'groupName1' }),
        ).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'groupName2' }),
        ).not.toBeChecked()
      })

      it('emits add with all groups when Select all is used', async () => {
        const user = userEvent.setup()
        const { emitted } = renderComponent({
          allGroups,
          allRoles: [allRoles[0]],
          isUserAdmin: true,
          tenant: makeTenant(),
        })
        await openAddFlow()

        await user.click(
          screen.getByRole('checkbox', { name: 'roleDescription1' }),
        )
        await user.click(groupSelectAll())
        await user.click(screen.getByRole('button', { name: 'Add user' }))

        expect(emitted().add[0]).toEqual([
          {
            id: 'userId1',
            roles: [allRoles[0]],
            ssoUser: { idpType: 'azureidir' },
          },
          [allGroups[0], allGroups[1]],
        ])
      })

      it('does not affect role selection', async () => {
        const user = userEvent.setup()
        renderComponent({
          allGroups,
          allRoles,
          isUserAdmin: true,
          tenant: makeTenant(),
        })
        await openAddFlow()

        await user.click(groupSelectAll())

        expect(roleSelectAll()).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'roleDescription1' }),
        ).not.toBeChecked()
        expect(screen.getByRole('button', { name: 'Add user' })).toBeDisabled()
      })
    })

    describe('reset behavior', () => {
      const selectEverything = async () => {
        const user = userEvent.setup()
        await user.click(roleSelectAll())
        await user.click(groupSelectAll())
      }

      it('resets both Select all checkboxes after cancel', async () => {
        const user = userEvent.setup()
        renderComponent({
          allGroups,
          allRoles: [allRoles[0]],
          isUserAdmin: true,
          tenant: makeTenant(),
        })
        await openAddFlow()
        await selectEverything()

        await user.click(screen.getByRole('button', { name: 'Cancel' }))
        await openAddFlow()

        expect(roleSelectAll()).not.toBeChecked()
        expect(groupSelectAll()).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'roleDescription1' }),
        ).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'groupName1' }),
        ).not.toBeChecked()
      })

      it('resets both Select all checkboxes after a successful add', async () => {
        const user = userEvent.setup()
        renderComponent({
          allGroups,
          allRoles: [allRoles[0]],
          isUserAdmin: true,
          tenant: makeTenant(),
        })
        await openAddFlow()
        await selectEverything()

        await user.click(screen.getByRole('button', { name: 'Add user' }))
        await openAddFlow()

        expect(roleSelectAll()).not.toBeChecked()
        expect(groupSelectAll()).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'roleDescription1' }),
        ).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'groupName1' }),
        ).not.toBeChecked()
      })

      it('resets both Select all checkboxes when the search is cleared', async () => {
        const user = userEvent.setup()
        renderComponent({
          allGroups,
          allRoles: [allRoles[0]],
          isUserAdmin: true,
          tenant: makeTenant(),
        })
        await openAddFlow()
        await selectEverything()

        await user.click(
          screen.getByRole('button', { name: 'stub-clear-search' }),
        )
        await user.click(screen.getByRole('button', { name: 'stub-select' }))

        expect(roleSelectAll()).not.toBeChecked()
        expect(groupSelectAll()).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'roleDescription1' }),
        ).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'groupName1' }),
        ).not.toBeChecked()
      })
    })
  })

  describe('search forwarding', () => {
    it('forwards a search event', async () => {
      const user = userEvent.setup()

      const { emitted } = renderComponent({
        isUserAdmin: true,
        tenant: makeTenant(),
      })

      await user.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await user.click(screen.getByRole('button', { name: 'stub-search' }))

      expect(emitted().search).toHaveLength(1)
      expect(emitted().search[0]).toEqual(['email', 'text'])
    })

    it('forwards a clear-search event', async () => {
      const user = userEvent.setup()
      const { emitted } = renderComponent({
        isUserAdmin: true,
        tenant: makeTenant(),
      })

      await user.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await user.click(
        screen.getByRole('button', { name: 'stub-clear-search' }),
      )

      expect(emitted()['clear-search']).toHaveLength(1)
    })
  })
})
