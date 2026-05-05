import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import {
  makeGroup,
  makeSsoUser,
  makeTenant,
  makeUser,
} from '@/__tests__/__factories__'

import GroupUserManagementContainer from '@/components/group/UserManagementContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { useGroupStore } from '@/stores/useGroupStore'
import { useUserStore } from '@/stores/useUserStore'
import { IDIR_SEARCH_TYPE } from '@/utils/constants'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

function mountComponent(group = makeGroup(), tenant = makeTenant()) {
  return mount(GroupUserManagementContainer, {
    props: { group, tenant },
    global: { stubs: { GroupUserManagement: true } },
  })
}

describe('GroupUserManagementContainer', () => {
  let groupStore: ReturnType<typeof useGroupStore>
  let userStore: ReturnType<typeof useUserStore>
  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(() => {
    setActivePinia(createPinia())
    groupStore = useGroupStore()
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
  })

  describe('handleAddUser', () => {
    it('calls addGroupUser, clears searchResults, and shows success notification', async () => {
      const group = makeGroup()
      const tenant = makeTenant()
      const user = makeUser()
      groupStore.addGroupUser = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent(group, tenant)
      await wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .vm.$emit('add', user)
      await nextTick()
      await nextTick()

      expect(groupStore.addGroupUser).toHaveBeenCalledWith(
        tenant.id,
        group.id,
        user,
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'New user successfully added to this group',
        'User Added',
      )
    })

    it('shows duplicate error notification and clears results on DuplicateEntityError', async () => {
      const group = makeGroup()
      const user = makeUser({
        ssoUser: makeSsoUser({ displayName: 'Jane Doe' }),
      })
      groupStore.addGroupUser = vi
        .fn()
        .mockRejectedValue(new DuplicateEntityError())

      const wrapper = mountComponent(group)
      await wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .vm.$emit('add', user)
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Jane Doe'),
      )
    })

    it('shows generic error notification on unexpected error', async () => {
      groupStore.addGroupUser = vi
        .fn()
        .mockRejectedValue(new Error('unexpected'))

      const wrapper = mountComponent()
      await wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .vm.$emit('add', makeUser())
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to add user to group',
      )
    })
  })

  // --- handleClearSearch -----------------------------------------------------

  describe('handleClearSearch', () => {
    it('sets searchResults to null', async () => {
      const wrapper = mountComponent()
      await wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .vm.$emit('clear-search')

      expect(
        wrapper
          .getComponent({ name: 'GroupUserManagement' })
          .props('searchResults'),
      ).toBeNull()
    })
  })

  // --- handleDeleteUser ------------------------------------------------------

  describe('handleDeleteUser', () => {
    it('calls removeGroupUser and shows success notification', async () => {
      const group = makeGroup()
      const tenant = makeTenant()
      groupStore.removeGroupUser = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent(group, tenant)
      await wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .vm.$emit('delete', 'gu1')
      await nextTick()
      await nextTick()

      expect(groupStore.removeGroupUser).toHaveBeenCalledWith(
        tenant.id,
        group.id,
        'gu1',
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'User successfully removed from this group',
        'User Removed',
      )
    })

    it('shows error notification when removeGroupUser fails', async () => {
      groupStore.removeGroupUser = vi.fn().mockRejectedValue(new Error('fail'))

      const wrapper = mountComponent()
      await wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .vm.$emit('delete', 'gu1')
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to remove user from group',
      )
    })
  })

  // --- handleUserSearch ------------------------------------------------------

  describe('handleUserSearch', () => {
    beforeEach(() => {
      userStore.searchIdirFirstName = vi
        .fn()
        .mockResolvedValue([makeUser({ id: 'a' })])
      userStore.searchIdirLastName = vi
        .fn()
        .mockResolvedValue([makeUser({ id: 'b' })])
      userStore.searchIdirEmail = vi
        .fn()
        .mockResolvedValue([makeUser({ id: 'c' })])
      userStore.searchBCeIDDisplayName = vi
        .fn()
        .mockResolvedValue([makeUser({ id: 'd' })])
      userStore.searchBCeIDEmail = vi
        .fn()
        .mockResolvedValue([makeUser({ id: 'e' })])
    })

    it('searches by first name and concatenates BCeID display name results', async () => {
      const wrapper = mountComponent()
      await wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .vm.$emit('search', IDIR_SEARCH_TYPE.FIRST_NAME.value, 'Jane')
      await nextTick()
      await nextTick()

      expect(userStore.searchIdirFirstName).toHaveBeenCalledWith('Jane')
      expect(userStore.searchBCeIDDisplayName).toHaveBeenCalledWith('Jane')
      expect(
        wrapper
          .getComponent({ name: 'GroupUserManagement' })
          .props('searchResults'),
      ).toHaveLength(2)
    })

    it('searches by last name and concatenates BCeID display name results', async () => {
      const wrapper = mountComponent()
      await wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .vm.$emit('search', IDIR_SEARCH_TYPE.LAST_NAME.value, 'Smith')
      await nextTick()
      await nextTick()

      expect(userStore.searchIdirLastName).toHaveBeenCalledWith('Smith')
      expect(userStore.searchBCeIDDisplayName).toHaveBeenCalledWith('Smith')
      expect(
        wrapper
          .getComponent({ name: 'GroupUserManagement' })
          .props('searchResults'),
      ).toHaveLength(2)
    })

    it('searches by email and concatenates BCeID email results', async () => {
      const wrapper = mountComponent()
      await wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .vm.$emit('search', IDIR_SEARCH_TYPE.EMAIL.value, 'jane@example.com')
      await nextTick()
      await nextTick()

      expect(userStore.searchIdirEmail).toHaveBeenCalledWith('jane@example.com')
      expect(userStore.searchBCeIDEmail).toHaveBeenCalledWith(
        'jane@example.com',
      )
      expect(
        wrapper
          .getComponent({ name: 'GroupUserManagement' })
          .props('searchResults'),
      ).toHaveLength(2)
    })

    it('shows error and nulls results when search throws', async () => {
      userStore.searchIdirFirstName = vi
        .fn()
        .mockRejectedValue(new Error('network'))

      const wrapper = mountComponent()
      await wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .vm.$emit('search', IDIR_SEARCH_TYPE.FIRST_NAME.value, 'Jane')
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith('User search failed')
      expect(
        wrapper
          .getComponent({ name: 'GroupUserManagement' })
          .props('searchResults'),
      ).toBeNull()
    })

    it('resets isLoadingSearch to false after search completes', async () => {
      const wrapper = mountComponent()
      await wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .vm.$emit('search', IDIR_SEARCH_TYPE.EMAIL.value, 'x@x.com')
      await nextTick()
      await nextTick()

      expect(
        wrapper
          .getComponent({ name: 'GroupUserManagement' })
          .props('loadingSearch'),
      ).toBe(false)
    })

    it('resets isLoadingSearch to false even when search throws', async () => {
      userStore.searchIdirEmail = vi.fn().mockRejectedValue(new Error('fail'))

      const wrapper = mountComponent()
      await wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .vm.$emit('search', IDIR_SEARCH_TYPE.EMAIL.value, 'x@x.com')
      await nextTick()
      await nextTick()

      expect(
        wrapper
          .getComponent({ name: 'GroupUserManagement' })
          .props('loadingSearch'),
      ).toBe(false)
    })
  })

  it('sets searchResults to null on cancel', async () => {
    userStore.searchIdirEmail = vi
      .fn()
      .mockResolvedValue([makeUser({ id: 'a' })])
    userStore.searchBCeIDEmail = vi
      .fn()
      .mockResolvedValue([makeUser({ id: 'b' })])

    const wrapper = mountComponent()

    // First populate searchResults so we can confirm it gets cleared
    await wrapper
      .getComponent({ name: 'GroupUserManagement' })
      .vm.$emit('search', IDIR_SEARCH_TYPE.EMAIL.value, 'x@x.com')
    await nextTick()
    await nextTick()

    await wrapper
      .getComponent({ name: 'GroupUserManagement' })
      .vm.$emit('cancel')
    await nextTick()

    expect(
      wrapper
        .getComponent({ name: 'GroupUserManagement' })
        .props('searchResults'),
    ).toBeNull()
  })
})
