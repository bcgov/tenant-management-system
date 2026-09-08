import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  makeGroup,
  makeSsoUser,
  makeTenant,
  makeUser,
} from '@/__tests__/__factories__'

import GroupMemberContainer from '@/components/route/GroupMemberContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { toGroupId } from '@/models/group.model'
import { toTenantId } from '@/models/tenant.model'
import { toUserId } from '@/models/user.model'
import vuetify from '@/plugins/vuetify'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { useUserSearchStore } from '@/stores/useUserSearchStore'
import { IDIR_SEARCH_TYPE } from '@/utils/constants'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

const child = (wrapper: ReturnType<typeof mountComponent>) => {
  return wrapper.getComponent({ name: 'GroupMemberManagement' })
}

const mountComponent = (groupId = 'groupId1', tenantId = 'tenantId1') => {
  return mount(GroupMemberContainer, {
    global: {
      plugins: [vuetify],
      stubs: {
        GroupMemberManagement: true,
        LoginContainer: { template: '<div><slot /></div>' },
      },
    },
    props: { groupId: toGroupId(groupId), tenantId: toTenantId(tenantId) },
  })
}

describe('GroupMemberContainer', () => {
  let groupStore: ReturnType<typeof useGroupStore>
  let tenantStore: ReturnType<typeof useTenantStore>
  let userSearchStore: ReturnType<typeof useUserSearchStore>
  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(() => {
    setActivePinia(createPinia())

    groupStore = useGroupStore()
    groupStore.groups = [makeGroup({ id: toGroupId('groupId1') })]

    tenantStore = useTenantStore()
    tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId1') })]

    userSearchStore = useUserSearchStore()

    notificationMock = {
      items: [],

      error: vi.fn(),
      info: vi.fn(),
      remove: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    }
    vi.mocked(useNotification).mockReturnValue(notificationMock)
  })

  describe('group and tenant computed', () => {
    it('passes the resolved group and tenant down as props', async () => {
      const group = makeGroup({ id: toGroupId('groupId1') })
      groupStore.groups = [group]
      const tenant = makeTenant({ id: toTenantId('tenantId1') })
      tenantStore.tenants = [tenant]

      const wrapper = mountComponent()

      expect(child(wrapper).props('group')).toEqual(group)
      expect(child(wrapper).props('tenant')).toEqual(tenant)
    })
  })

  describe('handleAddMember', () => {
    it('calls addGroupUser, clears searchResults, and shows success notification', async () => {
      const user = makeUser({ id: toUserId('userId1') })
      groupStore.addGroupUser = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent('groupId1', 'tenantId1')
      await child(wrapper).vm.$emit('add', user)
      await flushPromises()

      expect(groupStore.addGroupUser).toHaveBeenCalledWith(
        'tenantId1',
        'groupId1',
        user,
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'New member successfully added to this group',
        'Member Added',
      )
      expect(child(wrapper).props('searchResults')).toBeNull()
    })

    it('shows duplicate error and clears searchResults on DuplicateEntityError', async () => {
      const user = makeUser({
        ssoUser: makeSsoUser({ displayName: 'displayName' }),
      })
      const error = new DuplicateEntityError()
      groupStore.addGroupUser = vi.fn().mockRejectedValue(error)

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('add', user)
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith(
        expect.stringContaining('displayName'),
      )
      expect(child(wrapper).props('searchResults')).toBeNull()
    })

    it('shows generic error notification on unexpected addGroupUser error', async () => {
      groupStore.addGroupUser = vi.fn().mockRejectedValue(new Error('message'))

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit('add', makeUser())
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to add member to group',
      )
    })
  })

  describe('handleClearSearch', () => {
    it('sets searchResults to null', async () => {
      userSearchStore.searchUsers = vi
        .fn()
        .mockResolvedValue([makeUser({ id: toUserId('userId') })])

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.EMAIL.value,
        'email@example.com',
      )
      await flushPromises()

      await child(wrapper).vm.$emit('clear-search')

      expect(child(wrapper).props('searchResults')).toBeNull()
    })
  })

  describe('handleDeleteMember', () => {
    it('calls removeGroupUser and shows success notification', async () => {
      groupStore.removeGroupUser = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent('groupId1', 'tenantId1')
      await child(wrapper).vm.$emit('delete', 'groupUserId1')
      await flushPromises()

      expect(groupStore.removeGroupUser).toHaveBeenCalledWith(
        toTenantId('tenantId1'),
        toGroupId('groupId1'),
        'groupUserId1',
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'Member successfully removed from this group',
        'Member Removed',
      )
    })

    it('shows error notification when removeGroupUser fails', async () => {
      groupStore.removeGroupUser = vi.fn().mockRejectedValue(new Error('fail'))

      const wrapper = mountComponent('groupId1', 'tenantId1')
      await child(wrapper).vm.$emit('delete', 'groupUserId1')
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to remove member from group',
      )
    })
  })

  describe('handleUserSearch', () => {
    beforeEach(() => {
      userSearchStore.searchUsers = vi
        .fn()
        .mockResolvedValue([makeUser({ id: toUserId('userId') })])
    })

    it('searches for users and displays results', async () => {
      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.FIRST_NAME.value,
        'searchFirstName',
      )
      await flushPromises()

      expect(userSearchStore.searchUsers).toHaveBeenCalledWith(
        IDIR_SEARCH_TYPE.FIRST_NAME.value,
        'searchFirstName',
      )
      expect(child(wrapper).props('searchResults')).toEqual([
        expect.objectContaining({ id: toUserId('userId') }),
      ])
    })

    it('shows error notification when searchUsers fails', async () => {
      userSearchStore.searchUsers = vi
        .fn()
        .mockRejectedValue(new Error('message'))
      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.FIRST_NAME.value,
        'searchFirstName',
      )
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith('User search failed')
    })
  })

  describe('@cancel inline handler', () => {
    it('sets searchResults to null on cancel', async () => {
      userSearchStore.searchUsers = vi
        .fn()
        .mockResolvedValue([
          makeUser({ id: toUserId('userId1') }),
          makeUser({ id: toUserId('userId2') }),
        ])

      const wrapper = mountComponent()
      await child(wrapper).vm.$emit(
        'search',
        IDIR_SEARCH_TYPE.EMAIL.value,
        'email@example.com',
      )
      await flushPromises()

      expect(child(wrapper).props('searchResults')).toHaveLength(2)

      await child(wrapper).vm.$emit('cancel')
      await flushPromises()

      expect(child(wrapper).props('searchResults')).toBeNull()
    })
  })
})
