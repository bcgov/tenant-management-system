import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  makeGroup,
  makeRole,
  makeSsoUser,
  makeTenant,
  makeUser,
} from '@/__tests__/__factories__'

import TenantUserContainer from '@/components/route/TenantUserContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { toGroupId } from '@/models/group.model'
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

const loginContainerStub = {
  name: 'LoginContainer',
  template: '<div><slot /></div>',
}

const loadingWrapperStub = {
  name: 'LoadingWrapper',
  props: ['loading', 'loadingMessage'],
  template: '<div><slot /></div>',
}

const child = (wrapper: ReturnType<typeof mountComponent>) => {
  return wrapper.getComponent({ name: 'TenantUserManagement' })
}

const mountComponent = (tenantId = 'tenantId1') => {
  return mount(TenantUserContainer, {
    global: {
      plugins: [vuetify],
      stubs: {
        LoadingWrapper: loadingWrapperStub,
        LoginContainer: loginContainerStub,
        TenantUserManagement: true,
      },
    },
    props: { tenantId: toTenantId(tenantId) },
  })
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

    tenantStore = useTenantStore()
    tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId1') })]

    notificationMock = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      remove: vi.fn(),
      items: [],
    }
    vi.mocked(useNotification).mockReturnValue(notificationMock)

    // Default no-op for onMounted fetchRoles
    roleStore.fetchRoles = vi.fn().mockResolvedValue(undefined)
  })

  describe('onMounted', () => {
    it('throws an error when the tenant cannot be found', () => {
      tenantStore.tenants = []

      expect(() => mountComponent()).toThrow('Tenant tenantId1 not found')
    })

    it('calls fetchRoles on mount', async () => {
      mountComponent()
      await flushPromises()

      expect(roleStore.fetchRoles).toHaveBeenCalled()
    })

    it('shows error notification when fetchRoles fails', async () => {
      roleStore.fetchRoles = vi.fn().mockRejectedValue(new Error('fail'))

      mountComponent()
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load roles',
      )
    })
  })

  describe('loading computed', () => {
    it('does not render TenantUserManagement until roles are loaded', async () => {
      let resolveRoles!: () => void
      roleStore.fetchRoles = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveRoles = () => resolve()
          }),
      )
      const wrapper = mount(TenantUserContainer, {
        global: {
          plugins: [vuetify],
          stubs: {
            LoginContainer: loginContainerStub,
            TenantUserManagement: true,
          },
        },
        props: { tenantId: toTenantId('tenantId1') },
      })

      expect(
        wrapper.findComponent({ name: 'TenantUserManagement' }).exists(),
      ).toBe(false)

      resolveRoles()
      await flushPromises()

      expect(
        wrapper.findComponent({ name: 'TenantUserManagement' }).exists(),
      ).toBe(true)
    })
  })

  describe('roles computed', () => {
    it('passes roleStore.roles down as possible-roles prop', async () => {
      const roles = [makeRole()]
      roleStore.roles = roles

      const wrapper = mountComponent()
      await flushPromises()

      expect(child(wrapper).props('possibleRoles')).toEqual(roles)
    })
  })

  describe('handleAddUser', () => {
    it('calls addTenantUser, clears searchResults, and shows success notification', async () => {
      const user = makeUser()
      tenantStore.addTenantUser = vi.fn().mockResolvedValue(undefined)
      const tenantId = 'tenantId1'
      const tenant = makeTenant({ id: toTenantId(tenantId) })
      tenantStore.tenants.push(tenant)
      groupStore.addGroupUser = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent(tenantId)
      await child(wrapper).vm.$emit('add', user, [])
      await flushPromises()

      expect(tenantStore.addTenantUser).toHaveBeenCalledWith(tenantId, user)
      expect(notificationMock.success).toHaveBeenCalledWith(
        'New user successfully added to this tenant',
        'User Added',
      )
      expect(child(wrapper).props('searchResults')).toBeNull()
    })

    it('adds user to each provided group and shows group success notification', async () => {
      const user = makeUser()
      const groups = [
        makeGroup({ id: toGroupId('groupId1') }),
        makeGroup({ id: toGroupId('groupId2') }),
      ]
      tenantStore.addTenantUser = vi.fn().mockResolvedValue(undefined)
      const tenantId = 'tenantId1'
      const tenant = makeTenant({ id: toTenantId(tenantId) })
      tenantStore.tenants.push(tenant)
      groupStore.addGroupUser = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent(tenantId)
      await child(wrapper).vm.$emit('add', user, groups)
      await flushPromises()

      expect(groupStore.addGroupUser).toHaveBeenCalledTimes(2)
      expect(groupStore.addGroupUser).toHaveBeenCalledWith(
        tenantId,
        'groupId1',
        user,
      )
      expect(groupStore.addGroupUser).toHaveBeenCalledWith(
        tenantId,
        'groupId2',
        user,
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'New user successfully added to groups',
        'User Added to Groups',
      )
    })

    it('does not show group success notification when groups array is empty', async () => {
      const user = makeUser()
      tenantStore.addTenantUser = vi.fn().mockResolvedValue(undefined)
      const tenantId = 'tenantId1'
      const tenant = makeTenant({ id: toTenantId(tenantId) })
      tenantStore.tenants.push(tenant)
      groupStore.addGroupUser = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent(tenantId)
      await child(wrapper).vm.$emit('add', user, [])
      await flushPromises()

      const groupSuccessCalls = vi
        .mocked(notificationMock.success)
        .mock.calls.filter(([, title]) => title === 'User Added to Groups')
      expect(groupSuccessCalls).toHaveLength(0)
    })

    it('shows duplicate error and clears searchResults on DuplicateEntityError', async () => {
      const user = makeUser({
        ssoUser: makeSsoUser({ displayName: 'Jane Doe' }),
      })
      tenantStore.addTenantUser = vi
        .fn()
        .mockRejectedValue(new DuplicateEntityError())

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('add', user, [])
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Jane Doe'),
      )
      expect(child(wrapper).props('searchResults')).toBeNull()
    })

    it('shows generic error notification on unexpected addTenantUser error', async () => {
      tenantStore.addTenantUser = vi
        .fn()
        .mockRejectedValue(new Error('unexpected'))

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('add', makeUser(), [])
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith('Failed to add user')
    })

    it('does not attempt to add groups when addTenantUser fails', async () => {
      tenantStore.addTenantUser = vi.fn().mockRejectedValue(new Error('fail'))
      groupStore.addGroupUser = vi.fn()

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('add', makeUser(), [makeGroup()])
      await flushPromises()

      expect(groupStore.addGroupUser).not.toHaveBeenCalled()
    })

    it('shows group error notification when addGroupUser fails', async () => {
      tenantStore.addTenantUser = vi.fn().mockResolvedValue(undefined)
      groupStore.addGroupUser = vi
        .fn()
        .mockRejectedValue(new Error('group fail'))

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('add', makeUser(), [makeGroup()])
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to add user to groups',
      )
    })
  })

  describe('handleClearSearch', () => {
    it('sets searchResults to null', async () => {
      userSearchStore.searchUsers = vi
        .fn()
        .mockResolvedValue([
          makeUser({ id: toUserId('a') }),
          makeUser({ id: toUserId('b') }),
        ])

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.EMAIL.value,
        'x@x.com',
      )
      await flushPromises()

      await child(wrapper).vm.$emit('clear-search')
      await flushPromises()

      expect(child(wrapper).props('searchResults')).toBeNull()
    })
  })

  describe('@cancel inline handler', () => {
    it('sets searchResults to null on cancel', async () => {
      userSearchStore.searchUsers = vi
        .fn()
        .mockResolvedValue([
          makeUser({ id: toUserId('a') }),
          makeUser({ id: toUserId('b') }),
        ])

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.EMAIL.value,
        'x@x.com',
      )
      await flushPromises()

      await child(wrapper).vm.$emit('cancel')
      await flushPromises()

      expect(child(wrapper).props('searchResults')).toBeNull()
    })
  })

  describe('handleRemoveRole', () => {
    it('calls removeTenantUserRole and shows success notification', async () => {
      tenantStore.removeTenantUserRole = vi.fn().mockResolvedValue(undefined)
      const tenantId = 'tenant-1'
      const tenant = makeTenant({ id: toTenantId(tenantId) })
      tenantStore.tenants.push(tenant)

      const wrapper = mountComponent(tenantId)
      await child(wrapper).vm.$emit('remove-role', 'userId1', 'roleId1')
      await flushPromises()

      expect(tenantStore.removeTenantUserRole).toHaveBeenCalledWith(
        tenantId,
        'userId1',
        'roleId1',
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'The role was successfully removed from the user',
        'Role Removed',
      )
    })

    it('shows error notification when removeTenantUserRole fails', async () => {
      tenantStore.removeTenantUserRole = vi
        .fn()
        .mockRejectedValue(new Error('fail'))

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('remove-role', 'userId1', 'roleId1')
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to remove user role',
      )
    })
  })

  describe('handleRemoveUser', () => {
    it('calls removeTenantUser and shows success notification', async () => {
      tenantStore.removeTenantUser = vi.fn().mockResolvedValue(undefined)
      const tenantId = 'tenantId1'
      const tenant = makeTenant({ id: toTenantId(tenantId) })
      tenantStore.tenants.push(tenant)

      const wrapper = mountComponent(tenantId)
      await child(wrapper).vm.$emit('remove-user', 'userId1')
      await flushPromises()

      expect(tenantStore.removeTenantUser).toHaveBeenCalledWith(
        tenantId,
        'userId1',
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'The user was successfully removed',
        'User Removed',
      )
    })

    it('shows error notification when removeTenantUser fails', async () => {
      tenantStore.removeTenantUser = vi
        .fn()
        .mockRejectedValue(new Error('fail'))

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('remove-user', 'userId1')
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to remove user',
      )
    })

    it('shows error notification when userId is undefined', async () => {
      tenantStore.removeTenantUser = vi.fn()

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('remove-user', undefined)
      await flushPromises()

      expect(tenantStore.removeTenantUser).not.toHaveBeenCalled()
      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to remove user',
      )
    })
  })

  describe('handleUserSearch', () => {
    beforeEach(() => {
      userSearchStore.searchUsers = vi
        .fn()
        .mockResolvedValue([makeUser({ id: toUserId('a') })])
    })

    it('searches by first name and concatenates BCeID display name results', async () => {
      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.FIRST_NAME.value,
        'Jane',
      )
      await flushPromises()

      expect(userSearchStore.searchUsers).toHaveBeenCalledWith(
        IDIR_SEARCH_TYPE.FIRST_NAME.value,
        'Jane',
      )
      expect(child(wrapper).props('searchResults')).toHaveLength(1)
    })

    it('searches by last name and concatenates BCeID display name results', async () => {
      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.LAST_NAME.value,
        'Smith',
      )
      await flushPromises()

      expect(userSearchStore.searchUsers).toHaveBeenCalledWith(
        IDIR_SEARCH_TYPE.LAST_NAME.value,
        'Smith',
      )
      expect(child(wrapper).props('searchResults')).toHaveLength(1)
    })

    it('searches by email and concatenates BCeID email results', async () => {
      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.EMAIL.value,
        'jane@example.com',
      )
      await flushPromises()

      expect(userSearchStore.searchUsers).toHaveBeenCalledWith(
        IDIR_SEARCH_TYPE.EMAIL.value,
        'jane@example.com',
      )
      expect(child(wrapper).props('searchResults')).toHaveLength(1)
    })

    it('shows error and nulls results when search throws', async () => {
      userSearchStore.searchUsers = vi
        .fn()
        .mockRejectedValue(new Error('network'))

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.FIRST_NAME.value,
        'Jane',
      )
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith('User search failed')
      expect(child(wrapper).props('searchResults')).toBeNull()
    })

    it('resets loadingSearch to false after search completes', async () => {
      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.EMAIL.value,
        'x@x.com',
      )
      await flushPromises()

      expect(child(wrapper).props('loadingSearch')).toBe(false)
    })

    it('resets loadingSearch to false even when search throws', async () => {
      userSearchStore.searchUsers = vi.fn().mockRejectedValue(new Error('fail'))

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.EMAIL.value,
        'x@x.com',
      )
      await flushPromises()

      expect(child(wrapper).props('loadingSearch')).toBe(false)
    })
  })
})
