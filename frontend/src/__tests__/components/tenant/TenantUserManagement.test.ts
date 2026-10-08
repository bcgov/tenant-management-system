import { fireEvent, render, screen } from '@testing-library/vue'
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
import { toGroupId } from '@/models/group.model'
import { type Role, toRoleId } from '@/models/role.model'
import { type Tenant } from '@/models/tenant.model'
import { toUserId, type User } from '@/models/user.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { currentUserHasRole } from '@/utils/permissions'

vi.mock('@/utils/permissions', () => ({
  currentUserHasRole: vi.fn(),
}))

vi.mock('@/stores/useGroupStore', () => ({
  useGroupStore: vi.fn(),
}))

const vuetify = createVuetify({ components, directives })

const tenantUserTableStub = {
  emits: ['remove-role', 'remove-user'],
  name: 'TenantUserTable',
  props: ['tenant', 'users'],
  template: `
    <div>
      <button @click="$emit('remove-role', users[0], { id: 'role-1' })">
        stub-remove-role
      </button>
      <button @click="$emit('remove-user', users[0])">stub-remove-user</button>
      <button @click="$emit('roles-changed', users[0], ['role-2', 'role-3'], ['role-1'])">
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
        @click="$emit('select', { id: 'user-1', ssoUser: { idpType: 'idir' } })"
      >
        stub-select
      </button>
    </div>
  `,
}

function renderComponent(props: {
  loadingSearch?: boolean
  possibleRoles?: Role[]
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
      loadingSearch: false,
      searchResults: null,
      ...props,
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useGroupStore).mockReturnValue({ groups: [] } as never)
})

describe('TenantUserManagement', () => {
  describe('User table', () => {
    it('remove-user event is forwarded', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const user = makeUser({ id: toUserId('user-1') })
      const { emitted } = renderComponent({
        tenant: makeTenant({ users: [user] }),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-remove-user' }),
      )

      expect(emitted()['remove-user']).toHaveLength(1)
      expect(emitted()['remove-user'][0]).toEqual(['user-1'])
    })

    it('remove-role event is forwarded', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const user = makeUser({ id: toUserId('user-1') })
      const { emitted } = renderComponent({
        tenant: makeTenant({ users: [user] }),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-remove-role' }),
      )

      expect(emitted()['remove-role']).toHaveLength(1)
      expect(emitted()['remove-role'][0]).toEqual(['user-1', 'role-1'])
    })

    it('add another user opens search', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ tenant: makeTenant() })

      expect(
        screen.queryByRole('button', { name: 'stub-search' }),
      ).not.toBeInTheDocument()

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )

      expect(
        screen.getByRole('button', { name: 'stub-search' }),
      ).toBeInTheDocument()
    })

    it('roles-changed event is forwarded with the user and both role lists', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const user = makeUser({ id: toUserId('user-1') })
      const { emitted } = renderComponent({
        tenant: makeTenant({ users: [user] }),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-roles-changed' }),
      )

      expect(emitted()['roles-changed']).toHaveLength(1)
      expect(emitted()['roles-changed'][0]).toEqual([
        user,
        ['role-2', 'role-3'],
        ['role-1'],
      ])
    })
  })

  describe('Add another user button', () => {
    it('is hidden for non-admins', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      renderComponent({ tenant: makeTenant() })

      expect(
        screen.queryByRole('button', {
          name: 'Add user to tenant',
        }),
      ).not.toBeInTheDocument()
    })

    it('is shown for admins', () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ tenant: makeTenant() })

      expect(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      ).toBeInTheDocument()
    })

    it('is hidden for admins once search is open', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ tenant: makeTenant() })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )

      expect(
        screen.queryByRole('button', {
          name: 'Add user to tenant',
        }),
      ).not.toBeInTheDocument()
    })
  })

  describe('Add user flow', () => {
    it('does not show the Add User button until a user is selected', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      renderComponent({ tenant: makeTenant() })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )

      expect(
        screen.queryByRole('button', { name: 'Add user' }),
      ).not.toBeInTheDocument()
    })

    it('disables Add User until a role is selected', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const role = makeRole({ id: toRoleId('role-1'), description: 'Role One' })

      renderComponent({ possibleRoles: [role], tenant: makeTenant() })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-select' }))

      expect(screen.getByRole('button', { name: 'Add user' })).toBeDisabled()

      await fireEvent.click(screen.getByRole('checkbox', { name: 'Role One' }))

      expect(screen.getByRole('button', { name: 'Add user' })).toBeEnabled()
    })

    it('emits cancel and closes the search flow when cancelled', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const { emitted } = renderComponent({ tenant: makeTenant() })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(emitted().cancel).toHaveLength(1)
      expect(
        screen.queryByRole('button', { name: 'stub-search' }),
      ).not.toBeInTheDocument()
    })

    it('does not show the group assignment step when there are no groups', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      vi.mocked(useGroupStore).mockReturnValue({ groups: [] } as never)

      renderComponent({ tenant: makeTenant() })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-select' }))

      expect(
        screen.queryByText('3. Assign group(s) to this user:'),
      ).not.toBeInTheDocument()
    })

    it('shows the group assignment step when groups exist', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const group = makeGroup({ id: toGroupId('group-1'), name: 'Group One' })
      vi.mocked(useGroupStore).mockReturnValue({ groups: [group] } as never)

      renderComponent({ tenant: makeTenant() })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-select' }))

      expect(
        screen.getByText('3. Assign group(s) to this user:'),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', { name: 'Group One' }),
      ).toBeInTheDocument()
    })

    it('emits add with the selected user, roles, and groups; closes the search flow', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const role = makeRole({ id: toRoleId('role-1'), description: 'Role One' })
      const group = makeGroup({ id: toGroupId('group-1'), name: 'Group One' })
      vi.mocked(useGroupStore).mockReturnValue({ groups: [group] } as never)

      const { emitted } = renderComponent({
        possibleRoles: [role],
        tenant: makeTenant(),
      })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-select' }))
      await fireEvent.click(screen.getByRole('checkbox', { name: 'Role One' }))
      await fireEvent.click(screen.getByRole('checkbox', { name: 'Group One' }))
      await fireEvent.click(screen.getByRole('button', { name: 'Add user' }))

      expect(emitted().add).toHaveLength(1)
      expect(emitted().add[0]).toEqual([
        { id: 'user-1', roles: [role], ssoUser: { idpType: 'idir' } },
        [group],
      ])

      expect(
        screen.queryByRole('button', { name: 'stub-search' }),
      ).not.toBeInTheDocument()
    })
  })

  describe('Select all', () => {
    const role1 = makeRole({ id: toRoleId('role-1'), description: 'Role One' })
    const role2 = makeRole({ id: toRoleId('role-2'), description: 'Role Two' })
    const group1 = makeGroup({ id: toGroupId('group-1'), name: 'Group One' })
    const group2 = makeGroup({ id: toGroupId('group-2'), name: 'Group Two' })

    // DOM order: the roles "Select all" is rendered before the groups one.
    const roleSelectAll = () =>
      screen.getAllByRole('checkbox', { name: 'Select all' })[0]
    const groupSelectAll = () =>
      screen.getAllByRole('checkbox', { name: 'Select all' })[1]

    const openAddFlow = async () => {
      await fireEvent.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-select' }))
    }

    beforeEach(() => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      vi.mocked(useGroupStore).mockReturnValue({
        groups: [group1, group2],
      } as never)
    })

    describe('roles', () => {
      it('checks every role and enables Add User when checked', async () => {
        renderComponent({
          possibleRoles: [role1, role2],
          tenant: makeTenant(),
        })
        await openAddFlow()

        expect(screen.getByRole('button', { name: 'Add user' })).toBeDisabled()

        await fireEvent.click(roleSelectAll())

        expect(screen.getByRole('checkbox', { name: 'Role One' })).toBeChecked()
        expect(screen.getByRole('checkbox', { name: 'Role Two' })).toBeChecked()
        expect(screen.getByRole('button', { name: 'Add user' })).toBeEnabled()
      })

      it('unchecks every role and disables Add User when unchecked', async () => {
        renderComponent({
          possibleRoles: [role1, role2],
          tenant: makeTenant(),
        })
        await openAddFlow()

        await fireEvent.click(roleSelectAll())
        await fireEvent.click(roleSelectAll())

        expect(
          screen.getByRole('checkbox', { name: 'Role One' }),
        ).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'Role Two' }),
        ).not.toBeChecked()
        expect(screen.getByRole('button', { name: 'Add user' })).toBeDisabled()
      })

      it('emits add with all roles when Select all is used', async () => {
        const { emitted } = renderComponent({
          possibleRoles: [role1, role2],
          tenant: makeTenant(),
        })
        await openAddFlow()

        await fireEvent.click(roleSelectAll())
        await fireEvent.click(screen.getByRole('button', { name: 'Add user' }))

        expect(emitted().add).toHaveLength(1)
        expect(emitted().add[0]).toEqual([
          { id: 'user-1', roles: [role1, role2], ssoUser: { idpType: 'idir' } },
          [],
        ])
      })
    })

    describe('groups', () => {
      it('checks every group when checked', async () => {
        renderComponent({ possibleRoles: [role1], tenant: makeTenant() })
        await openAddFlow()

        await fireEvent.click(groupSelectAll())

        expect(
          screen.getByRole('checkbox', { name: 'Group One' }),
        ).toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'Group Two' }),
        ).toBeChecked()
      })

      it('unchecks every group when unchecked', async () => {
        renderComponent({ possibleRoles: [role1], tenant: makeTenant() })
        await openAddFlow()

        await fireEvent.click(groupSelectAll())
        await fireEvent.click(groupSelectAll())

        expect(
          screen.getByRole('checkbox', { name: 'Group One' }),
        ).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'Group Two' }),
        ).not.toBeChecked()
      })

      it('emits add with all groups when Select all is used', async () => {
        const { emitted } = renderComponent({
          possibleRoles: [role1],
          tenant: makeTenant(),
        })
        await openAddFlow()

        await fireEvent.click(
          screen.getByRole('checkbox', { name: 'Role One' }),
        )
        await fireEvent.click(groupSelectAll())
        await fireEvent.click(screen.getByRole('button', { name: 'Add user' }))

        expect(emitted().add[0]).toEqual([
          { id: 'user-1', roles: [role1], ssoUser: { idpType: 'idir' } },
          [group1, group2],
        ])
      })

      it('does not affect role selection', async () => {
        renderComponent({
          possibleRoles: [role1, role2],
          tenant: makeTenant(),
        })
        await openAddFlow()

        await fireEvent.click(groupSelectAll())

        expect(roleSelectAll()).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'Role One' }),
        ).not.toBeChecked()
        expect(screen.getByRole('button', { name: 'Add user' })).toBeDisabled()
      })
    })

    describe('reset behavior', () => {
      const selectEverything = async () => {
        await fireEvent.click(roleSelectAll())
        await fireEvent.click(groupSelectAll())
      }

      it('resets both Select all checkboxes after cancel', async () => {
        renderComponent({ possibleRoles: [role1], tenant: makeTenant() })
        await openAddFlow()
        await selectEverything()

        await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
        await openAddFlow()

        expect(roleSelectAll()).not.toBeChecked()
        expect(groupSelectAll()).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'Role One' }),
        ).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'Group One' }),
        ).not.toBeChecked()
      })

      it('resets both Select all checkboxes after a successful add', async () => {
        renderComponent({ possibleRoles: [role1], tenant: makeTenant() })
        await openAddFlow()
        await selectEverything()

        await fireEvent.click(screen.getByRole('button', { name: 'Add user' }))
        await openAddFlow()

        expect(roleSelectAll()).not.toBeChecked()
        expect(groupSelectAll()).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'Role One' }),
        ).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'Group One' }),
        ).not.toBeChecked()
      })

      it('resets both Select all checkboxes when the search is cleared', async () => {
        renderComponent({ possibleRoles: [role1], tenant: makeTenant() })
        await openAddFlow()
        await selectEverything()

        await fireEvent.click(
          screen.getByRole('button', { name: 'stub-clear-search' }),
        )
        await fireEvent.click(
          screen.getByRole('button', { name: 'stub-select' }),
        )

        expect(roleSelectAll()).not.toBeChecked()
        expect(groupSelectAll()).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'Role One' }),
        ).not.toBeChecked()
        expect(
          screen.getByRole('checkbox', { name: 'Group One' }),
        ).not.toBeChecked()
      })
    })
  })

  describe('search forwarding', () => {
    it('forwards a search event', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const { emitted } = renderComponent({ tenant: makeTenant() })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await fireEvent.click(screen.getByRole('button', { name: 'stub-search' }))

      expect(emitted().search).toHaveLength(1)
      expect(emitted().search[0]).toEqual(['email', 'text'])
    })

    it('forwards a clear-search event', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const { emitted } = renderComponent({ tenant: makeTenant() })

      await fireEvent.click(
        screen.getByRole('button', { name: 'Add user to tenant' }),
      )
      await fireEvent.click(
        screen.getByRole('button', { name: 'stub-clear-search' }),
      )

      expect(emitted()['clear-search']).toHaveLength(1)
    })
  })
})
