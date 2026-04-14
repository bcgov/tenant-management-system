import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import TenantUserManagementContainer from '@/components/tenant/UserManagementContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { Group } from '@/models/group.model'
import { Role } from '@/models/role.model'
import { SsoUser } from '@/models/ssouser.model'
import { Tenant } from '@/models/tenant.model'
import { User } from '@/models/user.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useRoleStore } from '@/stores/useRoleStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { useUserStore } from '@/stores/useUserStore'
import { IDIR_SEARCH_TYPE } from '@/utils/constants'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

// --- Helpers -----------------------------------------------------------------

function makeUser(id = 'u1', displayName = 'Test User') {
  const ssoUser = new SsoUser(
    id,
    'username',
    'First',
    'Last',
    displayName,
    'e@e.com',
  )
  return new User(id, ssoUser, [])
}

function makeGroup(id = 'g1') {
  return new Group('creator', '2026-01-01', 'desc', id, 'Group One', [])
}

function makeTenant(id = 't1') {
  return new Tenant(
    'creator',
    '2026-01-01',
    'desc',
    id,
    'Tenant One',
    'CITZ',
    [],
  )
}

function makeRole(id = 'r1') {
  return new Role(id, 'Role One', 'desc')
}

// --- Setup -------------------------------------------------------------------

function child(wrapper: ReturnType<typeof mountComponent>) {
  return wrapper.getComponent({ name: 'TenantUserManagement' })
}

function mountComponent(tenant = makeTenant()) {
  return mount(TenantUserManagementContainer, {
    props: { tenant },
    global: { stubs: { TenantUserManagement: true } },
  })
}

describe('TenantUserManagementContainer', () => {
  let groupStore: ReturnType<typeof useGroupStore>
  let roleStore: ReturnType<typeof useRoleStore>
  let tenantStore: ReturnType<typeof useTenantStore>
  let userStore: ReturnType<typeof useUserStore>
  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(() => {
    setActivePinia(createPinia())
    groupStore = useGroupStore()
    roleStore = useRoleStore()
    tenantStore = useTenantStore()
    userStore = useUserStore()

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

  // --- onMounted -------------------------------------------------------------

  describe('onMounted', () => {
    it('calls fetchRoles on mount', async () => {
      mountComponent()
      await nextTick()

      expect(roleStore.fetchRoles).toHaveBeenCalled()
    })

    it('shows error notification when fetchRoles fails', async () => {
      roleStore.fetchRoles = vi.fn().mockRejectedValue(new Error('fail'))

      mountComponent()
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load roles',
      )
    })
  })

  // --- roles computed --------------------------------------------------------

  describe('roles computed', () => {
    it('passes roleStore.roles down as possible-roles prop', async () => {
      const roles = [makeRole()]
      roleStore.roles = roles

      const wrapper = mountComponent()
      await nextTick()

      expect(child(wrapper).props('possibleRoles')).toEqual(roles)
    })
  })

  // --- handleAddUser ---------------------------------------------------------

  describe('handleAddUser', () => {
    it('calls addTenantUser, clears searchResults, and shows success notification', async () => {
      const tenant = makeTenant()
      const user = makeUser()
      tenantStore.addTenantUser = vi.fn().mockResolvedValue(undefined)
      groupStore.addGroupUser = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent(tenant)
      await child(wrapper).vm.$emit('add', user, [])
      await nextTick()
      await nextTick()

      expect(tenantStore.addTenantUser).toHaveBeenCalledWith(tenant, user)
      expect(notificationMock.success).toHaveBeenCalledWith(
        'New user successfully added to this tenant',
        'User Added',
      )
      expect(child(wrapper).props('searchResults')).toBeNull()
    })

    it('adds user to each provided group and shows group success notification', async () => {
      const tenant = makeTenant()
      const user = makeUser()
      const groups = [makeGroup('g1'), makeGroup('g2')]
      tenantStore.addTenantUser = vi.fn().mockResolvedValue(undefined)
      groupStore.addGroupUser = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent(tenant)
      await child(wrapper).vm.$emit('add', user, groups)
      await nextTick()
      await nextTick()

      expect(groupStore.addGroupUser).toHaveBeenCalledTimes(2)
      expect(groupStore.addGroupUser).toHaveBeenCalledWith(
        tenant.id,
        'g1',
        user,
      )
      expect(groupStore.addGroupUser).toHaveBeenCalledWith(
        tenant.id,
        'g2',
        user,
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'New user succesfully added to groups',
        'User Added to Groups',
      )
    })

    it('does not show group success notification when groups array is empty', async () => {
      const tenant = makeTenant()
      const user = makeUser()
      tenantStore.addTenantUser = vi.fn().mockResolvedValue(undefined)
      groupStore.addGroupUser = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent(tenant)
      await child(wrapper).vm.$emit('add', user, [])
      await nextTick()
      await nextTick()

      const groupSuccessCalls = vi
        .mocked(notificationMock.success)
        .mock.calls.filter(([, title]) => title === 'User Added to Groups')
      expect(groupSuccessCalls).toHaveLength(0)
    })

    it('shows duplicate error and clears searchResults on DuplicateEntityError', async () => {
      const user = makeUser('u1', 'Jane Doe')
      tenantStore.addTenantUser = vi
        .fn()
        .mockRejectedValue(new DuplicateEntityError())

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('add', user, [])
      await nextTick()
      await nextTick()

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
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith('Failed to add user')
    })

    it('does not attempt to add groups when addTenantUser fails', async () => {
      tenantStore.addTenantUser = vi.fn().mockRejectedValue(new Error('fail'))
      groupStore.addGroupUser = vi.fn()

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('add', makeUser(), [makeGroup()])
      await nextTick()
      await nextTick()

      expect(groupStore.addGroupUser).not.toHaveBeenCalled()
    })

    it('shows group error notification when addGroupUser fails', async () => {
      tenantStore.addTenantUser = vi.fn().mockResolvedValue(undefined)
      groupStore.addGroupUser = vi
        .fn()
        .mockRejectedValue(new Error('group fail'))

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('add', makeUser(), [makeGroup()])
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to add user to groups',
      )
    })
  })

  // --- handleClearSearch -----------------------------------------------------

  describe('handleClearSearch', () => {
    it('sets searchResults to null', async () => {
      userStore.searchIdirEmail = vi.fn().mockResolvedValue([makeUser('a')])
      userStore.searchBCeIDEmail = vi.fn().mockResolvedValue([makeUser('b')])

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.EMAIL.value,
        'x@x.com',
      )
      await nextTick()
      await nextTick()

      await child(wrapper).vm.$emit('clear-search')
      await nextTick()

      expect(child(wrapper).props('searchResults')).toBeNull()
    })
  })

  // --- cancel inline handler -------------------------------------------------

  describe('@cancel inline handler', () => {
    it('sets searchResults to null on cancel', async () => {
      userStore.searchIdirEmail = vi.fn().mockResolvedValue([makeUser('a')])
      userStore.searchBCeIDEmail = vi.fn().mockResolvedValue([makeUser('b')])

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.EMAIL.value,
        'x@x.com',
      )
      await nextTick()
      await nextTick()

      await child(wrapper).vm.$emit('cancel')
      await nextTick()

      expect(child(wrapper).props('searchResults')).toBeNull()
    })
  })

  // --- handleRemoveRole ------------------------------------------------------

  describe('handleRemoveRole', () => {
    it('calls removeTenantUserRole and shows success notification', async () => {
      const tenant = makeTenant()
      tenantStore.removeTenantUserRole = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent(tenant)
      await child(wrapper).vm.$emit('remove-role', 'u1', 'r1')
      await nextTick()
      await nextTick()

      expect(tenantStore.removeTenantUserRole).toHaveBeenCalledWith(
        tenant,
        'u1',
        'r1',
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
      await child(wrapper).vm.$emit('remove-role', 'u1', 'r1')
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to remove user role',
      )
    })
  })

  // --- handleRemoveUser ------------------------------------------------------

  describe('handleRemoveUser', () => {
    it('calls removeTenantUser and shows success notification', async () => {
      const tenant = makeTenant()
      tenantStore.removeTenantUser = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent(tenant)
      await child(wrapper).vm.$emit('remove-user', 'u1')
      await nextTick()
      await nextTick()

      expect(tenantStore.removeTenantUser).toHaveBeenCalledWith(tenant.id, 'u1')
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
      await child(wrapper).vm.$emit('remove-user', 'u1')
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to remove user',
      )
    })

    it('shows error notification when userId is undefined', async () => {
      tenantStore.removeTenantUser = vi.fn()

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('remove-user', undefined)
      await nextTick()
      await nextTick()

      expect(tenantStore.removeTenantUser).not.toHaveBeenCalled()
      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to remove user',
      )
    })
  })

  // --- handleUserSearch ------------------------------------------------------

  describe('handleUserSearch', () => {
    beforeEach(() => {
      userStore.searchIdirFirstName = vi.fn().mockResolvedValue([makeUser('a')])
      userStore.searchIdirLastName = vi.fn().mockResolvedValue([makeUser('b')])
      userStore.searchIdirEmail = vi.fn().mockResolvedValue([makeUser('c')])
      userStore.searchBCeIDDisplayName = vi
        .fn()
        .mockResolvedValue([makeUser('d')])
      userStore.searchBCeIDEmail = vi.fn().mockResolvedValue([makeUser('e')])
    })

    it('searches by first name and concatenates BCeID display name results', async () => {
      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.FIRST_NAME.value,
        'Jane',
      )
      await nextTick()
      await nextTick()

      expect(userStore.searchIdirFirstName).toHaveBeenCalledWith('Jane')
      expect(userStore.searchBCeIDDisplayName).toHaveBeenCalledWith('Jane')
      expect(child(wrapper).props('searchResults')).toHaveLength(2)
    })

    it('searches by last name and concatenates BCeID display name results', async () => {
      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.LAST_NAME.value,
        'Smith',
      )
      await nextTick()
      await nextTick()

      expect(userStore.searchIdirLastName).toHaveBeenCalledWith('Smith')
      expect(userStore.searchBCeIDDisplayName).toHaveBeenCalledWith('Smith')
      expect(child(wrapper).props('searchResults')).toHaveLength(2)
    })

    it('searches by email and concatenates BCeID email results', async () => {
      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.EMAIL.value,
        'jane@example.com',
      )
      await nextTick()
      await nextTick()

      expect(userStore.searchIdirEmail).toHaveBeenCalledWith('jane@example.com')
      expect(userStore.searchBCeIDEmail).toHaveBeenCalledWith(
        'jane@example.com',
      )
      expect(child(wrapper).props('searchResults')).toHaveLength(2)
    })

    it('shows error and nulls results when search throws', async () => {
      userStore.searchIdirFirstName = vi
        .fn()
        .mockRejectedValue(new Error('network'))

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.FIRST_NAME.value,
        'Jane',
      )
      await nextTick()
      await nextTick()

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
      await nextTick()
      await nextTick()

      expect(child(wrapper).props('loadingSearch')).toBe(false)
    })

    it('resets loadingSearch to false even when search throws', async () => {
      userStore.searchIdirEmail = vi.fn().mockRejectedValue(new Error('fail'))

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.EMAIL.value,
        'x@x.com',
      )
      await nextTick()
      await nextTick()

      expect(child(wrapper).props('loadingSearch')).toBe(false)
    })
  })
})
