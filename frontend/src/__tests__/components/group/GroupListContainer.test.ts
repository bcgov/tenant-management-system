import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import GroupListContainer from '@/components/group/GroupListContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ServerError } from '@/errors/domain/ServerError'
import { Group } from '@/models/group.model'
import { SsoUser } from '@/models/ssouser.model'
import { Tenant } from '@/models/tenant.model'
import { User } from '@/models/user.model'
import { useAuthStore } from '@/stores/useAuthStore'
import { useGroupStore } from '@/stores/useGroupStore'

// --- Mocks -------------------------------------------------------------------

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('@/utils/permissions', () => ({
  currentUserHasRole: vi.fn(),
}))

import { currentUserHasRole } from '@/utils/permissions'

// --- Helpers -----------------------------------------------------------------

function makeGroup(id = 'g1') {
  return new Group('creator', '2026-01-01', 'desc', id, 'Group One', [])
}

function makeTenant(id = 't1') {
  return new Tenant(
    'creator',
    '2026-01-01',
    'a tenant',
    id,
    'Tenant One',
    'min',
    [],
  )
}

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
// --- Setup -------------------------------------------------------------------

function mountComponent(tenant = makeTenant()) {
  return mount(GroupListContainer, {
    props: { tenant },
    global: {
      stubs: {
        GroupList: true,
        GroupCreateDialog: true,
        ButtonPrimary: true,
        'v-container': { template: '<div><slot /></div>' },
        'v-row': { template: '<div><slot /></div>' },
        'v-col': { template: '<div><slot /></div>' },
      },
    },
  })
}

describe('GroupListContainer', () => {
  let groupStore: ReturnType<typeof useGroupStore>
  let authStore: ReturnType<typeof useAuthStore>
  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(() => {
    setActivePinia(createPinia())
    groupStore = useGroupStore()
    authStore = useAuthStore()

    notificationMock = {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      remove: vi.fn(),
      items: [],
    }
    vi.mocked(useNotification).mockReturnValue(notificationMock)
    vi.mocked(currentUserHasRole).mockReturnValue(false)

    groupStore.fetchGroups = vi.fn().mockResolvedValue(undefined)
    groupStore.addGroup = vi.fn()
    groupStore.addGroupUser = vi.fn()
    mockPush.mockReset()
  })

  // --- onMounted / fetchGroups -----------------------------------------------

  describe('onMounted', () => {
    it('calls fetchGroups with the tenant id on mount', async () => {
      const tenant = makeTenant('t99')
      mountComponent(tenant)
      await nextTick()

      expect(groupStore.fetchGroups).toHaveBeenCalledWith('t99')
    })

    it('shows error notification when fetchGroups fails', async () => {
      groupStore.fetchGroups = vi.fn().mockRejectedValue(new Error('network'))

      mountComponent()
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load tenant groups',
      )
    })
  })

  // --- isUserAdmin / ButtonPrimary visibility --------------------------------

  describe('isUserAdmin', () => {
    it('renders ButtonPrimary when user is an admin', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.findComponent({ name: 'ButtonPrimary' }).exists()).toBe(
        true,
      )
    })

    it('does not render ButtonPrimary when user is not an admin', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(false)

      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.findComponent({ name: 'ButtonPrimary' }).exists()).toBe(
        false,
      )
    })
  })

  // --- handleCardClick -------------------------------------------------------

  describe('handleCardClick', () => {
    it('navigates to the group detail route on select', async () => {
      const tenant = makeTenant('t1')
      groupStore.groups = [makeGroup('g42')]
      groupStore.loading = false

      const wrapper = mountComponent(tenant)
      await nextTick()

      wrapper.getComponent({ name: 'GroupList' }).vm.$emit('select', 'g42')
      await nextTick()

      expect(mockPush).toHaveBeenCalledWith('/tenants/t1/groups/g42')
    })
  })

  // --- handleGroupCreate -----------------------------------------------------

  describe('handleGroupCreate', () => {
    const groupDetails = { name: 'My Group', description: 'A description' }

    it('calls addGroup with tenant id, name, and description', async () => {
      groupStore.addGroup = vi.fn().mockResolvedValue(makeGroup())

      const wrapper = mountComponent()
      await nextTick()

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', groupDetails, false)
      await nextTick()
      await nextTick()

      expect(groupStore.addGroup).toHaveBeenCalledWith(
        't1',
        groupDetails.name,
        groupDetails.description,
      )
    })

    it('shows success notification and closes dialog on successful create', async () => {
      groupStore.addGroup = vi.fn().mockResolvedValue(makeGroup())

      const wrapper = mountComponent()
      await nextTick()

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', groupDetails, false)
      await nextTick()
      await nextTick()

      expect(notificationMock.success).toHaveBeenCalledWith(
        'Group Created Successfully',
      )
      expect(
        wrapper.getComponent({ name: 'GroupCreateDialog' }).props('modelValue'),
      ).toBe(false)
    })

    it('sets isDuplicateName to true on DuplicateEntityError', async () => {
      groupStore.addGroup = vi
        .fn()
        .mockRejectedValue(new DuplicateEntityError())

      const wrapper = mountComponent()
      await nextTick()

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', groupDetails, false)
      await nextTick()
      await nextTick()

      expect(
        wrapper
          .getComponent({ name: 'GroupCreateDialog' })
          .props('isDuplicateName'),
      ).toBe(true)
    })

    it('shows userMessage on DomainError with a userMessage', async () => {
      const err = new DomainError(
        'DomainError',
        'Something specific went wrong',
      )
      groupStore.addGroup = vi.fn().mockRejectedValue(err)

      const wrapper = mountComponent()
      await nextTick()

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', groupDetails, false)
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Something specific went wrong',
      )
    })

    it('shows ServerError userMessage when available', async () => {
      const err = new ServerError('Server blew up')
      groupStore.addGroup = vi.fn().mockRejectedValue(err)

      const wrapper = mountComponent()
      await nextTick()

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', groupDetails, false)
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith('Server blew up')
    })

    it('shows fallback message when ServerError has no userMessage', async () => {
      groupStore.addGroup = vi.fn().mockRejectedValue(new ServerError())

      const wrapper = mountComponent()
      await nextTick()

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', groupDetails, false)
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to create the new group',
      )
    })

    it('shows generic error message on unexpected error', async () => {
      groupStore.addGroup = vi.fn().mockRejectedValue(new Error('unexpected'))

      const wrapper = mountComponent()
      await nextTick()

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', groupDetails, false)
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to create the new group',
      )
    })

    it('calls addGroupUser after a successful group create when addUser is true', async () => {
      const group = makeGroup('g1')
      groupStore.addGroup = vi.fn().mockResolvedValue(group)
      groupStore.addGroupUser = vi.fn().mockResolvedValue(undefined)
      authStore.user = makeUser()

      const wrapper = mountComponent()
      await nextTick()

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', groupDetails, true)
      await nextTick()
      await nextTick()
      await nextTick()

      expect(groupStore.addGroupUser).toHaveBeenCalledWith(
        't1',
        'g1',
        authStore.authenticatedUser,
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'User added to Group Successfully',
      )
    })

    it('does not call addGroupUser when addUser is false', async () => {
      groupStore.addGroup = vi.fn().mockResolvedValue(makeGroup())
      groupStore.addGroupUser = vi.fn()

      const wrapper = mountComponent()
      await nextTick()

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', groupDetails, false)
      await nextTick()
      await nextTick()

      expect(groupStore.addGroupUser).not.toHaveBeenCalled()
    })

    it('shows error when addGroupUser fails with a DomainError userMessage', async () => {
      authStore.user = makeUser()
      groupStore.addGroup = vi.fn().mockResolvedValue(makeGroup('g1'))
      const userErr = new DomainError('DomainError', 'Cannot add user')
      groupStore.addGroupUser = vi.fn().mockRejectedValue(userErr)

      const wrapper = mountComponent()
      await nextTick()

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', groupDetails, true)
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith('Cannot add user')
    })

    it('shows generic error when addGroupUser fails unexpectedly', async () => {
      groupStore.addGroup = vi.fn().mockResolvedValue(makeGroup('g1'))
      groupStore.addGroupUser = vi
        .fn()
        .mockRejectedValue(new Error('network error'))

      const wrapper = mountComponent()
      await nextTick()

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', groupDetails, true)
      await nextTick()
      await nextTick()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to add the user to the new group',
      )
    })
  })

  // --- dialog open / close ---------------------------------------------------

  describe('dialog visibility', () => {
    it('opens the dialog when ButtonPrimary is clicked', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)

      const wrapper = mountComponent()
      await nextTick()

      expect(
        wrapper.getComponent({ name: 'GroupCreateDialog' }).props('modelValue'),
      ).toBe(false)

      wrapper.getComponent({ name: 'ButtonPrimary' }).vm.$emit('click')
      await nextTick()

      expect(
        wrapper.getComponent({ name: 'GroupCreateDialog' }).props('modelValue'),
      ).toBe(true)
    })

    it('clears isDuplicateName when clear-duplicate-error is emitted', async () => {
      groupStore.addGroup = vi
        .fn()
        .mockRejectedValue(new DuplicateEntityError())

      const wrapper = mountComponent()
      await nextTick()

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('submit', { name: 'Dup', description: '' }, false)
      await nextTick()
      await nextTick()

      expect(
        wrapper
          .getComponent({ name: 'GroupCreateDialog' })
          .props('isDuplicateName'),
      ).toBe(true)

      wrapper
        .getComponent({ name: 'GroupCreateDialog' })
        .vm.$emit('clear-duplicate-error')
      await nextTick()

      expect(
        wrapper
          .getComponent({ name: 'GroupCreateDialog' })
          .props('isDuplicateName'),
      ).toBe(false)
    })
  })

  it('closes the dialog when GroupCreateDialog emits update:modelValue false', async () => {
    vi.mocked(currentUserHasRole).mockReturnValue(true)

    const wrapper = mountComponent()
    await nextTick()

    // Open it first
    wrapper.getComponent({ name: 'ButtonPrimary' }).vm.$emit('click')
    await nextTick()

    expect(
      wrapper.getComponent({ name: 'GroupCreateDialog' }).props('modelValue'),
    ).toBe(true)

    // Now close via v-model emit
    wrapper
      .getComponent({ name: 'GroupCreateDialog' })
      .vm.$emit('update:modelValue', false)
    await nextTick()

    expect(
      wrapper.getComponent({ name: 'GroupCreateDialog' }).props('modelValue'),
    ).toBe(false)
  })

  // --- empty state -----------------------------------------------------------

  describe('empty state', () => {
    it('shows the empty state message when there are no groups', async () => {
      groupStore.groups = []
      groupStore.loading = false

      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain(
        'No groups have been created for this tenant yet.',
      )
    })

    it('shows Create a Group hint for admins in the empty state', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(true)
      groupStore.groups = []
      groupStore.loading = false

      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain('Click Create a Group to get started.')
    })

    it('does not show Create a Group hint for non-admins in the empty state', async () => {
      vi.mocked(currentUserHasRole).mockReturnValue(false)
      groupStore.groups = []
      groupStore.loading = false

      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.text()).not.toContain(
        'Click Create a Group to get started.',
      )
    })
  })
})
