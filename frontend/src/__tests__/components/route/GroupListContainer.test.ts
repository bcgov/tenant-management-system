import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeGroup, makeTenant, makeUser } from '@/__tests__/__factories__'
import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import GroupListContainer from '@/components/route/GroupListContainer.vue'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ServerError } from '@/errors/domain/ServerError'
import { toGroupId } from '@/models/group.model'
import { toTenantId } from '@/models/tenant.model'
import { toUserId } from '@/models/user.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { currentUserHasRole } from '@/utils/permissions'

const mockError = vi.fn()
const mockPush = vi.fn()
const mockSuccess = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@/composables/useNotification', () => ({
  useNotification: () => ({
    error: mockError,
    success: mockSuccess,
  }),
}))

let currentAuthStore = createMockAuthStore()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

vi.mock('@/utils/permissions', () => ({
  currentUserHasRole: vi.fn(),
}))

const mountComponent = () =>
  mount(GroupListContainer, {
    props: {
      tenantId: toTenantId('tenantId1'),
    },
    global: {
      stubs: {
        ButtonPrimary: {
          emits: ['click'],
          name: 'ButtonPrimary',
          template: `
            <button @click="$emit('click')">
              create
            </button>
          `,
        },
        GroupCreateDialog: {
          emits: ['clear-duplicate-error', 'submit', 'update:modelValue'],
          name: 'GroupCreateDialog',
          props: ['isDuplicateName', 'modelValue'],
          template: '<div />',
        },
        GroupList: {
          emits: ['select'],
          name: 'GroupList',
          props: ['groups'],
          template: '<div />',
        },
        LoginContainer: {
          template: '<div><slot /></div>',
        },
        'v-col': {
          template: '<div><slot /></div>',
        },
        'v-container': {
          template: '<div><slot /></div>',
        },
        'v-row': {
          template: '<div><slot /></div>',
        },
      },
    },
  })

describe('GroupListContainer', () => {
  let groupStore: ReturnType<typeof useGroupStore>
  let tenantStore: ReturnType<typeof useTenantStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    currentAuthStore = createMockAuthStore({
      user: makeUser(),
    })

    groupStore = useGroupStore()
    groupStore.groups = []

    tenantStore = useTenantStore()
    tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId1') })]

    vi.mocked(currentUserHasRole).mockReturnValue(false)
  })

  it('throws an error when tenant is not found', () => {
    tenantStore.getTenant = vi.fn().mockReturnValue(undefined)

    expect(() => mountComponent()).toThrow('Tenant tenantId1 not found')
  })

  describe('create button', () => {
    it('shows when user is admin and no groups', () => {
      groupStore.groups = []
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const wrapper = mountComponent()

      expect(wrapper.findComponent({ name: 'ButtonPrimary' }).exists()).toBe(
        true,
      )
    })

    it('shows when user is admin and has groups', () => {
      groupStore.groups = [makeGroup()]
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const wrapper = mountComponent()

      expect(wrapper.findComponent({ name: 'ButtonPrimary' }).exists()).toBe(
        true,
      )
    })

    it('hides when user is not admin and no groups', () => {
      groupStore.groups = []
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      const wrapper = mountComponent()

      expect(wrapper.findComponent({ name: 'ButtonPrimary' }).exists()).toBe(
        false,
      )
    })

    it('hides when user is not admin and has groups', () => {
      groupStore.groups = [makeGroup()]
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      const wrapper = mountComponent()

      expect(wrapper.findComponent({ name: 'ButtonPrimary' }).exists()).toBe(
        false,
      )
    })
  })

  describe('template', () => {
    it('renders empty state when no groups exist', () => {
      const wrapper = mountComponent()

      expect(wrapper.text()).toContain('No groups yet')
    })

    it('renders GroupList when groups exist', () => {
      groupStore.groups = [makeGroup()]

      const wrapper = mountComponent()

      expect(wrapper.findComponent({ name: 'GroupList' }).exists()).toBe(true)
    })
  })

  describe('navigation', () => {
    it('navigates to group members when group selected', async () => {
      groupStore.groups = [makeGroup({ id: toGroupId('groupId1') })]

      const wrapper = mountComponent()
      await wrapper
        .findComponent({ name: 'GroupList' })
        .vm.$emit('select', 'groupId1')

      expect(mockPush).toHaveBeenCalledWith(
        '/tenants/tenantId1/groups/groupId1/members',
      )
    })
  })

  describe('dialog', () => {
    it('opens create dialog when create button clicked', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const wrapper = mountComponent()
      await wrapper.findComponent({ name: 'ButtonPrimary' }).trigger('click')

      expect(
        wrapper
          .findComponent({ name: 'GroupCreateDialog' })
          .props('modelValue'),
      ).toBe(true)
    })

    it('updates dialog visibility when dialog emits update:modelValue', async () => {
      const wrapper = mountComponent()
      const dialog = wrapper.findComponent({ name: 'GroupCreateDialog' })

      expect(dialog.props('modelValue')).toBe(false)

      await dialog.vm.$emit('update:modelValue', true)

      expect(dialog.props('modelValue')).toBe(true)

      await dialog.vm.$emit('update:modelValue', false)

      expect(dialog.props('modelValue')).toBe(false)
    })

    it('clears duplicate error when requested', async () => {
      const wrapper = mountComponent()
      await wrapper
        .findComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('clear-duplicate-error')

      expect(
        wrapper
          .findComponent({ name: 'GroupCreateDialog' })
          .props('isDuplicateName'),
      ).toBe(false)
    })
  })

  describe('handleGroupCreate', () => {
    it('creates group without adding user', async () => {
      groupStore.addGroup = vi.fn().mockResolvedValue(makeGroup())
      groupStore.addGroupUser = vi.fn()

      const wrapper = mountComponent()

      await wrapper
        .findComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', { description: 'description', name: 'name' }, false)
      await flushPromises()

      expect(groupStore.addGroup).toHaveBeenCalled()
      expect(groupStore.addGroupUser).not.toHaveBeenCalled()
      expect(mockSuccess).toHaveBeenCalledWith('Group Created Successfully')
    })

    it('shows group duplicate error', async () => {
      groupStore.addGroup = vi
        .fn()
        .mockRejectedValue(new DuplicateEntityError())
      const wrapper = mountComponent()

      await wrapper
        .findComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', { description: 'description', name: 'name' }, false)
      await flushPromises()

      expect(
        wrapper
          .findComponent({ name: 'GroupCreateDialog' })
          .props('isDuplicateName'),
      ).toBe(true)
    })

    it('shows group domain error message', async () => {
      groupStore.addGroup = vi
        .fn()
        .mockRejectedValue(new DomainError('message', 'userMessage'))
      const wrapper = mountComponent()

      await wrapper
        .findComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', { description: 'description', name: 'name' }, false)
      await flushPromises()

      expect(mockError).toHaveBeenCalledWith('userMessage')
    })

    it('shows group generic when domain error without user message', async () => {
      groupStore.addGroup = vi
        .fn()
        .mockRejectedValue(new DomainError('message'))
      const wrapper = mountComponent()

      await wrapper
        .findComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', { description: 'description', name: 'name' }, false)
      await flushPromises()

      expect(mockError).toHaveBeenCalledWith('Failed to create the new group')
    })

    it('shows group server error message', async () => {
      groupStore.addGroup = vi
        .fn()
        .mockRejectedValue(new ServerError('userMessage'))
      const wrapper = mountComponent()

      await wrapper
        .findComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', { description: 'description', name: 'name' }, false)
      await flushPromises()

      expect(mockError).toHaveBeenCalledWith('userMessage')
    })

    it('shows group generic error when server error has no user message', async () => {
      const error = new ServerError()
      groupStore.addGroup = vi.fn().mockRejectedValue(error)
      const wrapper = mountComponent()

      await wrapper
        .findComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', { description: 'description', name: 'name' }, false)
      await flushPromises()

      expect(mockError).toHaveBeenCalledWith('Failed to create the new group')
    })

    it('shows group generic error when group creation fails unexpectedly', async () => {
      groupStore.addGroup = vi.fn().mockRejectedValue(new Error('error'))
      const wrapper = mountComponent()

      await wrapper
        .findComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', { description: 'description', name: 'name' }, false)
      await flushPromises()

      expect(mockError).toHaveBeenCalledWith('Failed to create the new group')
    })

    it('adds user when requested', async () => {
      const user = makeUser({ id: toUserId('userId1') })
      currentAuthStore = createMockAuthStore({
        user: user,
      })
      groupStore.addGroup = vi.fn().mockResolvedValue(makeGroup())
      groupStore.addGroupUser = vi.fn().mockResolvedValue(undefined)
      const wrapper = mountComponent()

      await wrapper
        .findComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', { description: 'description', name: 'name' }, true)
      await flushPromises()

      expect(groupStore.addGroupUser).toHaveBeenCalledWith(
        'tenantId1',
        expect.anything(),
        user,
      )
    })

    it('shows user error when DomainError has user message', async () => {
      groupStore.addGroup = vi.fn().mockResolvedValue(makeGroup())
      groupStore.addGroupUser = vi
        .fn()
        .mockRejectedValue(new DomainError('message', 'userMessage'))
      const wrapper = mountComponent()

      await wrapper
        .findComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', { description: 'description', name: 'name' }, true)
      await flushPromises()

      expect(mockError).toHaveBeenCalledWith('userMessage')
    })

    it('shows user generic error when DomainError has no user message', async () => {
      groupStore.addGroup = vi.fn().mockResolvedValue(makeGroup())
      groupStore.addGroupUser = vi
        .fn()
        .mockRejectedValue(new DomainError('message'))
      const wrapper = mountComponent()

      await wrapper
        .findComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', { description: 'description', name: 'name' }, true)
      await flushPromises()

      expect(mockError).toHaveBeenCalledWith(
        'Failed to add the user to the new group',
      )
    })
  })
})
