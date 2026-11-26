import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import {
  makeGroup,
  makeRole,
  makeTenant,
  makeUser,
} from '@/__tests__/__factories__'

import TenantUserContainer from '@/components/route/TenantUserContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { toTenantId } from '@/models/tenant.model'
import { toUserId } from '@/models/user.model'
import vuetify from '@/plugins/vuetify'
import { useGroupStore } from '@/stores/useGroupStore'
import { useRoleStore } from '@/stores/useRoleStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { useUserSearchStore } from '@/stores/useUserSearchStore'
import { IDIR_SEARCH_TYPE } from '@/utils/constants'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

const loadingWrapperStub = {
  name: 'LoadingWrapper',
  props: ['loading', 'loadingMessage'],
  template: '<div><slot /></div>',
}

// Not really happy with how huge this stub is, but it does reflect that it is
// also not ideal how big the actual child component is.
const tenantUserManagementStub = {
  props: ['allGroups', 'allRoles', 'loadingSearch', 'searchResults'],
  emits: [
    'add',
    'cancel',
    'clear-search',
    'remove-role',
    'remove-user',
    'roles-changed',
    'search',
    'show-user-details',
  ],
  setup: () => ({ IDIR_SEARCH_TYPE }),
  template: `
    <div
      data-testid="tenant-user-management"
      :data-group-ids="allGroups.map((g) => g.id).join(',')"
      :data-role-ids="allRoles.map((r) => r.id).join(',')"
      :data-loading-search="loadingSearch"
      :data-search-result-count="searchResults?.length"
    >
      <!-- handleAddUser -->
      <button @click="$emit('add', { id: 'userId1', ssoUser: { displayName: 'Jane Doe' } }, [])">add user</button>
      <button @click="$emit('add', { id: 'userId1', ssoUser: { displayName: 'Jane Doe' } }, [{ id: 'groupId1' }, { id: 'groupId2' }])">add user to groups</button>

      <!-- handleUserSearch / clearing search -->
      <button @click="$emit('search', IDIR_SEARCH_TYPE.FIRST_NAME.value, 'firstName')">search by first name</button>
      <button @click="$emit('search', IDIR_SEARCH_TYPE.LAST_NAME.value, 'lastName')">search by last name</button>
      <button @click="$emit('search', IDIR_SEARCH_TYPE.EMAIL.value, 'email')">search by email</button>
      <button @click="$emit('clear-search')">clear search</button>
      <button @click="$emit('cancel')">cancel</button>

      <!-- handleRemoveRole / handleRemoveUser -->
      <button @click="$emit('remove-role', 'userId1', 'roleId1')">remove role</button>
      <button @click="$emit('remove-user', 'userId1')">remove user</button>
      <button @click="$emit('remove-user', undefined)">remove missing user</button>

      <!-- handleRolesChanged -->
      <button @click="$emit('roles-changed', { id: 'userId1' }, ['roleId1', 'roleId2'], [])">assign two roles</button>
      <button @click="$emit('roles-changed', { id: 'userId1' }, [], ['roleId1', 'roleId2'])">remove two roles</button>
      <button @click="$emit('roles-changed', { id: 'userId1' }, ['roleId1'], ['roleId2'])">assign one role and remove another</button>
      <button @click="$emit('roles-changed', { id: 'userId1' }, [], [])">change no roles</button>

      <!-- handleShowUserDetails -->
      <button @click="$emit('show-user-details', 'userId1')">show user details</button>
    </div>
  `,
}

const renderComponent = (tenantId = 'tenantIdDefault') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '',
        component: { template: '<div />' },
      },
      {
        path: '/tenants/:tenantId/users/:userId',
        component: { template: '<div />' },
      },
    ],
  })

  const view = render(TenantUserContainer, {
    global: {
      plugins: [router, vuetify],
      stubs: {
        LoadingWrapper: loadingWrapperStub,
        TenantUserManagement: tenantUserManagementStub,
      },
    },
    props: { tenantId: toTenantId(tenantId) },
  })

  return { ...view, router }
}

describe('TenantUserContainer', () => {
  let groupStore: ReturnType<typeof useGroupStore>
  let roleStore: ReturnType<typeof useRoleStore>
  let tenantStore: ReturnType<typeof useTenantStore>
  let userSearchStore: ReturnType<typeof useUserSearchStore>

  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(() => {
    setActivePinia(createPinia())
    groupStore = useGroupStore()
    roleStore = useRoleStore()
    tenantStore = useTenantStore()
    userSearchStore = useUserSearchStore()

    tenantStore.tenants = [makeTenant({ id: toTenantId('tenantIdDefault') })]

    notificationMock = {
      messages: ref([]),

      dismiss: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    }
    vi.mocked(useNotification).mockReturnValue(notificationMock)

    groupStore.fetchGroups = vi.fn().mockResolvedValue(undefined)
    roleStore.fetchRoles = vi.fn().mockResolvedValue(undefined)
  })

  describe('onMounted', () => {
    it('throws an error when the tenant cannot be found', () => {
      tenantStore.tenants = []

      expect(() => renderComponent('tenantId')).toThrow(
        'Tenant tenantId not found',
      )
    })

    it('calls fetchGroups on mount', async () => {
      renderComponent()

      expect(groupStore.fetchGroups).toHaveBeenCalled()
    })

    it('calls fetchRoles on mount', async () => {
      renderComponent()

      expect(roleStore.fetchRoles).toHaveBeenCalled()
    })

    it('shows error notification when fetchGroups fails', async () => {
      groupStore.fetchGroups = vi.fn().mockRejectedValue(new Error('message'))

      renderComponent()

      await waitFor(() => {
        expect(notificationMock.error).toHaveBeenCalledWith(
          'Failed to load groups',
        )
      })
    })

    it('shows error notification when fetchRoles fails', async () => {
      roleStore.fetchRoles = vi.fn().mockRejectedValue(new Error('message'))

      renderComponent()

      await waitFor(() => {
        expect(notificationMock.error).toHaveBeenCalledWith(
          'Failed to load roles',
        )
      })
    })
  })

  describe('groups and roles', () => {
    it('passes groupStore.groups down as the allGroups prop', async () => {
      const groups = [makeGroup()]
      groupStore.groups = groups

      renderComponent()

      expect(screen.getByTestId('tenant-user-management')).toHaveAttribute(
        'data-group-ids',
        groups.map((g) => g.id).join(','),
      )
    })

    it('passes roleStore.roles down as the allRoles prop', async () => {
      const roles = [makeRole()]
      roleStore.roles = roles

      renderComponent()

      expect(screen.getByTestId('tenant-user-management')).toHaveAttribute(
        'data-role-ids',
        roles.map((r) => r.id).join(','),
      )
    })
  })

  describe('handleAddUser', () => {
    beforeEach(() => {
      tenantStore.addTenantUser = vi.fn().mockResolvedValue(undefined)
      groupStore.addGroupUser = vi.fn().mockResolvedValue(undefined)
    })

    it('calls addTenantUser, clears searchResults, and shows success notification', async () => {
      tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]
      const user = userEvent.setup()

      renderComponent('tenantId')
      await user.click(screen.getByRole('button', { name: 'add user' }))

      expect(tenantStore.addTenantUser).toHaveBeenCalledWith(
        'tenantId',
        expect.objectContaining({ id: 'userId1' }),
      )
      expect(notificationMock.success).toHaveBeenCalledWith('User added')
      expect(screen.getByTestId('tenant-user-management')).not.toHaveAttribute(
        'data-search-result-count',
      )
    })

    it('adds user to each provided group and shows group success notification', async () => {
      tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]

      const user = userEvent.setup()

      renderComponent('tenantId')
      await user.click(
        screen.getByRole('button', { name: 'add user to groups' }),
      )

      expect(groupStore.addGroupUser).toHaveBeenCalledTimes(2)
      expect(groupStore.addGroupUser).toHaveBeenCalledWith(
        'tenantId',
        'groupId1',
        expect.objectContaining({ id: 'userId1' }),
      )
      expect(groupStore.addGroupUser).toHaveBeenCalledWith(
        'tenantId',
        'groupId2',
        expect.objectContaining({ id: 'userId1' }),
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'User added to groups',
      )
    })

    it('does not show group success notification when groups array is empty', async () => {
      const user = userEvent.setup()

      renderComponent()
      await user.click(screen.getByRole('button', { name: 'add user' }))

      expect(notificationMock.success).not.toHaveBeenCalledWith(
        'User added to groups',
      )
    })

    it('shows duplicate error and clears searchResults on DuplicateEntityError', async () => {
      const user = userEvent.setup()
      tenantStore.addTenantUser = vi
        .fn()
        .mockRejectedValue(new DuplicateEntityError())

      renderComponent()
      await user.click(screen.getByRole('button', { name: 'add user' }))

      expect(notificationMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Jane Doe'),
      )
      expect(screen.getByTestId('tenant-user-management')).not.toHaveAttribute(
        'data-search-result-count',
      )
    })

    it('shows generic error notification on unexpected addTenantUser error', async () => {
      const user = userEvent.setup()
      tenantStore.addTenantUser = vi
        .fn()
        .mockRejectedValue(new Error('message'))

      renderComponent()
      await user.click(screen.getByRole('button', { name: 'add user' }))

      expect(notificationMock.error).toHaveBeenCalledWith('Failed to add user')
    })

    it('does not attempt to add groups when addTenantUser fails', async () => {
      const user = userEvent.setup()
      tenantStore.addTenantUser = vi.fn().mockRejectedValue(new Error('fail'))

      renderComponent()
      await user.click(
        screen.getByRole('button', { name: 'add user to groups' }),
      )

      expect(groupStore.addGroupUser).not.toHaveBeenCalled()
    })

    it('shows group error notification when addGroupUser fails', async () => {
      const user = userEvent.setup()
      groupStore.addGroupUser = vi.fn().mockRejectedValue(new Error('message'))

      renderComponent()
      await user.click(
        screen.getByRole('button', { name: 'add user to groups' }),
      )

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to add user to groups',
      )
    })
  })

  describe('clearing search results', () => {
    beforeEach(() => {
      userSearchStore.searchUsers = vi
        .fn()
        .mockResolvedValue([
          makeUser({ id: toUserId('userId1') }),
          makeUser({ id: toUserId('userId2') }),
        ])
    })

    it.each(['clear search', 'cancel'])(
      '%s sets searchResults to null',
      async (buttonName) => {
        const user = userEvent.setup()

        renderComponent()
        await user.click(
          screen.getByRole('button', { name: 'search by email' }),
        )

        expect(screen.getByTestId('tenant-user-management')).toHaveAttribute(
          'data-search-result-count',
          '2',
        )

        await user.click(screen.getByRole('button', { name: buttonName }))

        expect(
          screen.getByTestId('tenant-user-management'),
        ).not.toHaveAttribute('data-search-result-count')
      },
    )
  })

  describe('handleRemoveRole', () => {
    it('calls removeTenantUserRole', async () => {
      tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]
      const user = userEvent.setup()
      tenantStore.removeTenantUserRole = vi.fn().mockResolvedValue(undefined)

      renderComponent('tenantId')
      await user.click(screen.getByRole('button', { name: 'remove role' }))

      expect(tenantStore.removeTenantUserRole).toHaveBeenCalledWith(
        'tenantId',
        'userId1',
        'roleId1',
      )
    })

    it('shows error notification when removeTenantUserRole fails', async () => {
      const user = userEvent.setup()
      tenantStore.removeTenantUserRole = vi
        .fn()
        .mockRejectedValue(new Error('message'))

      renderComponent()
      await user.click(screen.getByRole('button', { name: 'remove role' }))

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to remove user role',
      )
    })
  })

  describe('handleRemoveUser', () => {
    it('calls removeTenantUser and shows success notification', async () => {
      tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]
      const user = userEvent.setup()
      tenantStore.removeTenantUser = vi.fn().mockResolvedValue(undefined)

      renderComponent('tenantId')
      await user.click(screen.getByRole('button', { name: 'remove user' }))

      expect(tenantStore.removeTenantUser).toHaveBeenCalledWith(
        'tenantId',
        'userId1',
      )
      expect(notificationMock.success).toHaveBeenCalledWith('User removed')
    })

    it('shows error notification when removeTenantUser fails', async () => {
      const user = userEvent.setup()
      tenantStore.removeTenantUser = vi
        .fn()
        .mockRejectedValue(new Error('message'))

      renderComponent()
      await user.click(screen.getByRole('button', { name: 'remove user' }))

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to remove user',
      )
    })

    it('shows error notification when userId is undefined', async () => {
      const user = userEvent.setup()
      tenantStore.removeTenantUser = vi.fn()

      renderComponent()
      await user.click(
        screen.getByRole('button', { name: 'remove missing user' }),
      )

      expect(tenantStore.removeTenantUser).not.toHaveBeenCalled()
      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to remove user',
      )
    })
  })

  describe('handleRolesChanged', () => {
    beforeEach(() => {
      tenantStore.assignTenantUserRoles = vi.fn().mockResolvedValue(undefined)
      tenantStore.removeTenantUserRole = vi.fn().mockResolvedValue(undefined)
    })

    it('assigns roles when only adding', async () => {
      tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]
      const user = userEvent.setup()

      renderComponent('tenantId')
      await user.click(screen.getByRole('button', { name: 'assign two roles' }))

      expect(tenantStore.assignTenantUserRoles).toHaveBeenCalledTimes(1)
      expect(tenantStore.assignTenantUserRoles).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'tenantId' }),
        'userId1',
        ['roleId1', 'roleId2'],
      )
      expect(tenantStore.removeTenantUserRole).not.toHaveBeenCalled()
    })

    it('removes each role when only removing', async () => {
      tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]
      const user = userEvent.setup()

      renderComponent('tenantId')
      await user.click(screen.getByRole('button', { name: 'remove two roles' }))

      expect(tenantStore.assignTenantUserRoles).not.toHaveBeenCalled()
      expect(tenantStore.removeTenantUserRole).toHaveBeenCalledTimes(2)
      expect(tenantStore.removeTenantUserRole).toHaveBeenCalledWith(
        'tenantId',
        'userId1',
        'roleId1',
      )
      expect(tenantStore.removeTenantUserRole).toHaveBeenCalledWith(
        'tenantId',
        'userId1',
        'roleId2',
      )
    })

    it('assigns and removes roles when both are provided', async () => {
      tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]
      const user = userEvent.setup()

      renderComponent('tenantId')
      await user.click(
        screen.getByRole('button', {
          name: 'assign one role and remove another',
        }),
      )

      expect(tenantStore.assignTenantUserRoles).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'tenantId' }),
        'userId1',
        ['roleId1'],
      )
      expect(tenantStore.removeTenantUserRole).toHaveBeenCalledWith(
        'tenantId',
        'userId1',
        'roleId2',
      )
    })

    it('makes no store calls but still shows success when there are no changes', async () => {
      const user = userEvent.setup()

      renderComponent()
      await user.click(screen.getByRole('button', { name: 'change no roles' }))

      expect(tenantStore.assignTenantUserRoles).not.toHaveBeenCalled()
      expect(tenantStore.removeTenantUserRole).not.toHaveBeenCalled()
      expect(notificationMock.success).toHaveBeenCalled()
    })

    it('shows error and skips removals when assignTenantUserRoles fails', async () => {
      const user = userEvent.setup()
      tenantStore.assignTenantUserRoles = vi
        .fn()
        .mockRejectedValue(new Error('message'))

      renderComponent()
      await user.click(
        screen.getByRole('button', {
          name: 'assign one role and remove another',
        }),
      )

      expect(tenantStore.removeTenantUserRole).not.toHaveBeenCalled()
      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to update user roles',
      )
      expect(notificationMock.success).not.toHaveBeenCalled()
    })

    it('shows error and no success when removeTenantUserRole fails', async () => {
      const user = userEvent.setup()
      tenantStore.removeTenantUserRole = vi
        .fn()
        .mockRejectedValue(new Error('message'))

      renderComponent()
      await user.click(screen.getByRole('button', { name: 'remove two roles' }))

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to update user roles',
      )
      expect(notificationMock.success).not.toHaveBeenCalled()
    })
  })

  describe('handleShowUserDetails', () => {
    it('navigates to the user details route', async () => {
      tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]
      const user = userEvent.setup()

      const { router } = renderComponent('tenantId')
      await router.isReady()
      await user.click(
        screen.getByRole('button', { name: 'show user details' }),
      )

      await waitFor(() =>
        expect(router.currentRoute.value.fullPath).toBe(
          '/tenants/tenantId/users/userId1',
        ),
      )
    })
  })

  describe('handleUserSearch', () => {
    beforeEach(() => {
      userSearchStore.searchUsers = vi
        .fn()
        .mockResolvedValue([makeUser({ id: toUserId('userId') })])
    })

    it.each([
      ['search by first name', IDIR_SEARCH_TYPE.FIRST_NAME.value, 'firstName'],
      ['search by last name', IDIR_SEARCH_TYPE.LAST_NAME.value, 'lastName'],
      ['search by email', IDIR_SEARCH_TYPE.EMAIL.value, 'email'],
    ])('%s', async (buttonName, searchType, query) => {
      const user = userEvent.setup()

      renderComponent()
      await user.click(screen.getByRole('button', { name: buttonName }))

      expect(userSearchStore.searchUsers).toHaveBeenCalledWith(
        searchType,
        query,
      )
      expect(screen.getByTestId('tenant-user-management')).toHaveAttribute(
        'data-search-result-count',
        '1',
      )
    })

    it('shows error and nulls results when search throws', async () => {
      const user = userEvent.setup()
      userSearchStore.searchUsers = vi
        .fn()
        .mockRejectedValue(new Error('message'))

      renderComponent()
      await user.click(
        screen.getByRole('button', { name: 'search by first name' }),
      )

      expect(notificationMock.error).toHaveBeenCalledWith('User search failed')
      expect(screen.getByTestId('tenant-user-management')).not.toHaveAttribute(
        'data-search-result-count',
      )
    })

    it('resets loadingSearch to false after search completes', async () => {
      const user = userEvent.setup()

      renderComponent()
      await user.click(screen.getByRole('button', { name: 'search by email' }))

      expect(screen.getByTestId('tenant-user-management')).toHaveAttribute(
        'data-loading-search',
        'false',
      )
    })

    it('resets loadingSearch to false even when search throws', async () => {
      const user = userEvent.setup()
      userSearchStore.searchUsers = vi
        .fn()
        .mockRejectedValue(new Error('message'))

      renderComponent()
      await user.click(screen.getByRole('button', { name: 'search by email' }))

      expect(screen.getByTestId('tenant-user-management')).toHaveAttribute(
        'data-loading-search',
        'false',
      )
    })
  })
})
