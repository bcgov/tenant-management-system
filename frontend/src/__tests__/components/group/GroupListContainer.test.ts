import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { makeGroup, makeTenant, makeUser } from '@/__tests__/__factories__'

import GroupListContainer from '@/components/group/GroupListContainer.vue'
import { DomainError } from '@/errors/domain/DomainError'
import { ServerError } from '@/errors/domain/ServerError'
import { Group } from '@/models/group.model'
import { User } from '@/models/user.model'
import { useAuthStore } from '@/stores/useAuthStore'
import { useGroupStore } from '@/stores/useGroupStore'
import { currentUserHasRole } from '@/utils/permissions'

vi.mock('@/services/config.service', () => ({
  config: { api: { baseUrl: 'http://localhost/api' }, oidc: {} },
}))

const mockNotify = { success: vi.fn(), error: vi.fn() }
vi.mock('@/composables/useNotification', () => ({
  useNotification: () => mockNotify,
}))

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/utils/permissions', () => ({
  currentUserHasRole: vi.fn(),
}))

vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: vi.fn() }))
vi.mock('@/stores/useGroupStore', () => ({ useGroupStore: vi.fn() }))

type AuthStoreMock = Partial<ReturnType<typeof useAuthStore>>
type GroupStoreMock = Partial<ReturnType<typeof useGroupStore>>

const mountComponent = (tenant = makeTenant({ id: 't1' })) => {
  return mount(GroupListContainer, {
    props: { tenant },
    global: {
      stubs: {
        GroupCreateDialog: {
          name: 'GroupCreateDialog',
          template: '<div id="dialog-stub" />',
          props: ['isDuplicateName', 'modelValue'],
        },
        GroupList: {
          name: 'GroupList',
          template: '<div id="list-stub" />',
          props: ['groups', 'isAdmin'],
        },
        ButtonPrimary: {
          template:
            '<button id="create-btn" @click="$emit(\'click\')"><slot /></button>',
        },
        'v-container': {
          template: '<div class="v-container-stub"><slot /></div>',
        },
        'v-row': { template: '<div><slot /></div>' },
        'v-col': { template: '<div><slot /></div>' },
      },
    },
  })
}

describe('GroupListContainer.vue', () => {
  let mockAuth: AuthStoreMock
  let mockGroup: GroupStoreMock

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth = { authenticatedUser: null as unknown as User }
    mockGroup = {
      addGroup: vi.fn(),
      addGroupUser: vi.fn(),
      fetchGroups: vi.fn(),
      loading: false,
      groups: [] as Group[],
    }
    vi.mocked(useAuthStore).mockReturnValue(
      mockAuth as ReturnType<typeof useAuthStore>,
    )
    vi.mocked(useGroupStore).mockReturnValue(
      mockGroup as ReturnType<typeof useGroupStore>,
    )
  })

  describe('Template and Lifecycle', () => {
    it('fetches groups on mount', () => {
      mountComponent()
      expect(mockGroup.fetchGroups).toHaveBeenCalledWith('t1')
    })

    it('renders empty state when no groups exist', () => {
      mockGroup.groups = []
      const wrapper = mountComponent()
      expect(wrapper.find('.v-container-stub').exists()).toBe(true)
    })

    it('handles clear-duplicate-error event', async () => {
      const wrapper = mountComponent()
      const dialog = wrapper.getComponent({ name: 'GroupCreateDialog' })

      await dialog.vm.$emit('clear-duplicate-error')
      expect(dialog.props('isDuplicateName')).toBe(false)
    })
  })

  describe('handleGroupCreate Logic', () => {
    it('skips user addition if addUser is false', async () => {
      const addMock = vi.mocked(mockGroup.addGroup)
      if (addMock) addMock.mockResolvedValue(makeGroup())
      const addUserSpy = vi.spyOn(mockGroup, 'addGroupUser')

      const wrapper = mountComponent()
      const dialog = wrapper.getComponent({ name: 'GroupCreateDialog' })

      await dialog.vm.$emit('submit', { name: 'G' }, false)
      await nextTick()

      expect(addMock).toHaveBeenCalled()
      expect(addUserSpy).not.toHaveBeenCalled()
    })

    it('handles successful creation and user addition', async () => {
      const user = makeUser()
      Object.assign(mockAuth, { authenticatedUser: user })
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const addMock = vi.mocked(mockGroup.addGroup)
      if (addMock) addMock.mockResolvedValue(makeGroup())
      const addUserMock = vi.mocked(mockGroup.addGroupUser)
      if (addUserMock)
        addUserMock.mockResolvedValue(undefined as unknown as void)

      const wrapper = mountComponent()
      const dialog = wrapper.getComponent({ name: 'GroupCreateDialog' })

      await dialog.vm.$emit('submit', { name: 'New G' }, true)
      await nextTick()
      await nextTick()

      expect(mockNotify.success).toHaveBeenCalledWith(
        'User added to Group Successfully',
      )
    })

    it('covers error branches during creation and addition', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      const wrapper = mountComponent()
      const dialog = wrapper.getComponent({ name: 'GroupCreateDialog' })
      const addMock = vi.mocked(mockGroup.addGroup)

      const srvError = new ServerError('Tech')
      Object.defineProperty(srvError, 'userMessage', { value: null })
      if (addMock) addMock.mockRejectedValueOnce(srvError)
      await dialog.vm.$emit('submit', { name: 'G' }, false)
      await nextTick()
      expect(mockNotify.error).toHaveBeenLastCalledWith(
        'Failed to create the new group',
      )

      const user = makeUser()
      Object.assign(mockAuth, { authenticatedUser: user })
      if (addMock) addMock.mockResolvedValue(makeGroup())
      const addUserMock = vi.mocked(mockGroup.addGroupUser)
      if (addUserMock)
        addUserMock.mockRejectedValueOnce(new DomainError('E', 'Add Fail'))

      await dialog.vm.$emit('submit', { name: 'G' }, true)
      await nextTick()
      await nextTick()
      expect(mockNotify.error).toHaveBeenLastCalledWith('Add Fail')
    })
  })

  it('navigates to group detail on selection', async () => {
    mockGroup.groups = [makeGroup({ id: 'g1' })]
    const wrapper = mountComponent()
    const list = wrapper.getComponent({ name: 'GroupList' })
    await list.vm.$emit('select', 'g1')
    expect(mockPush).toHaveBeenCalledWith('/tenants/t1/groups/g1')
  })
})
