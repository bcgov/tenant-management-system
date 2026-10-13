import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import {
  makeGroup,
  makeGroupService,
  makeGroupServiceRole,
  makeTenant,
} from '@/__tests__/__factories__'

import GroupHeaderContainer from '@/components/route/GroupHeaderContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { DomainError } from '@/errors/domain/DomainError'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ServerError } from '@/errors/domain/ServerError'
import { type GroupDetailFields, toGroupId } from '@/models/group.model'
import { toGroupServiceId } from '@/models/groupservice.model'
import { toGroupServiceRoleId } from '@/models/groupservicerole.model'
import { toTenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

const mountComponent = () =>
  mount(GroupHeaderContainer, {
    global: {
      stubs: {
        GroupHeader: true,
        LoadingWrapper: { template: '<div><slot /></div>' },
        LoginContainer: { template: '<div><slot /></div>' },
        RouterView: { template: '<div data-testid="router-view" />' },
      },
    },
    props: {
      groupId: toGroupId('groupId1'),
      tenantId: toTenantId('tenantId1'),
    },
  })

// TODO: adjust to match the real shape of GroupDetailFields.
const groupDetails = {
  description: 'New description',
  name: 'New name',
} as GroupDetailFields

describe('GroupHeaderContainer', () => {
  let groupStore: ReturnType<typeof useGroupStore>
  let notificationMock: ReturnType<typeof useNotification>
  let tenantStore: ReturnType<typeof useTenantStore>

  beforeEach(() => {
    setActivePinia(createPinia())

    groupStore = useGroupStore()
    tenantStore = useTenantStore()

    groupStore.fetchGroup = vi.fn().mockResolvedValue(undefined)
    groupStore.fetchGroupServices = vi.fn().mockResolvedValue(undefined)
    groupStore.updateGroupDetails = vi.fn().mockResolvedValue(undefined)

    notificationMock = {
      messages: ref([]),

      dismiss: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    }

    vi.mocked(useNotification).mockReturnValue(notificationMock)
  })

  it('fetches the group and group services on mount', async () => {
    mountComponent()

    expect(groupStore.fetchGroup).toHaveBeenCalledWith('tenantId1', 'groupId1')
    expect(groupStore.fetchGroupServices).toHaveBeenCalledWith(
      'tenantId1',
      'groupId1',
    )
  })

  it('shows an error when loading the group fails', async () => {
    groupStore.fetchGroup = vi.fn().mockRejectedValue(new Error())

    mountComponent()
    await flushPromises()

    expect(notificationMock.error).toHaveBeenCalledWith('Failed to load group')
  })

  it('shows an error when loading group services fails', async () => {
    groupStore.fetchGroupServices = vi.fn().mockRejectedValue(new Error())

    mountComponent()
    await flushPromises()

    expect(notificationMock.error).toHaveBeenCalledWith(
      'Failed to load group servicess',
    )
  })

  it('passes computed props to GroupHeader', async () => {
    groupStore.groups = [makeGroup({ id: toGroupId('groupId1') })]
    groupStore.groupServices = [
      makeGroupService({
        id: toGroupServiceId('groupService1'),
        roles: [
          makeGroupServiceRole({
            id: toGroupServiceRoleId('role1'),
            isEnabled: false,
            name: 'Role 1',
          }),
        ],
      }),
      makeGroupService({
        id: toGroupServiceId('groupService2'),
        roles: [
          makeGroupServiceRole({
            id: toGroupServiceRoleId('role2'),
            isEnabled: true,
            name: 'Role 2',
          }),
          makeGroupServiceRole({
            id: toGroupServiceRoleId('role3'),
            isEnabled: false,
            name: 'Role 3',
          }),
          makeGroupServiceRole({
            id: toGroupServiceRoleId('role4'),
            isEnabled: true,
            name: 'Role 4',
          }),
        ],
      }),
      makeGroupService({
        id: toGroupServiceId('groupService3'),
        roles: [
          makeGroupServiceRole({
            id: toGroupServiceRoleId('role5'),
            isEnabled: true,
            name: 'Role 5',
          }),
        ],
      }),
    ]
    tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId1') })]

    const wrapper = mountComponent()

    const header = wrapper.getComponent({ name: 'GroupHeader' })
    expect(header.props('group')).toEqual(groupStore.groups[0])
    expect(header.props('tenant')).toEqual(tenantStore.tenants[0])
    expect(header.props('enabledRolesCount')).toBe(3)
    expect(header.props('enabledServiceCount')).toBe(2)
  })

  it('renders the router view', async () => {
    const wrapper = mountComponent()

    expect(wrapper.find('[data-testid="router-view"]').exists()).toBe(true)
  })

  describe('edit dialog', () => {
    const getHeader = (wrapper: ReturnType<typeof mountComponent>) =>
      wrapper.getComponent({ name: 'GroupHeader' })

    const submitEdit = async (wrapper: ReturnType<typeof mountComponent>) => {
      getHeader(wrapper).vm.$emit('submit', groupDetails)
      await flushPromises()
    }

    const openDialog = async (wrapper: ReturnType<typeof mountComponent>) => {
      getHeader(wrapper).vm.$emit('update:dialogVisible', true)
      await flushPromises()
    }

    it('starts with the dialog closed and no duplicate error', () => {
      const header = getHeader(mountComponent())

      expect(header.props('dialogVisible')).toBe(false)
      expect(header.props('isDuplicateName')).toBe(false)
    })

    it('updates dialogVisible when GroupHeader emits update:dialogVisible', async () => {
      const wrapper = mountComponent()

      await openDialog(wrapper)
      expect(getHeader(wrapper).props('dialogVisible')).toBe(true)

      getHeader(wrapper).vm.$emit('update:dialogVisible', false)
      await flushPromises()
      expect(getHeader(wrapper).props('dialogVisible')).toBe(false)
    })

    it('updates the group details when the form is submitted', async () => {
      const wrapper = mountComponent()

      await submitEdit(wrapper)

      expect(groupStore.updateGroupDetails).toHaveBeenCalledWith(
        'tenantId1',
        'groupId1',
        groupDetails,
      )
    })

    it('closes the dialog on success', async () => {
      const wrapper = mountComponent()
      await openDialog(wrapper)

      await submitEdit(wrapper)

      expect(notificationMock.error).not.toHaveBeenCalled()
      expect(notificationMock.success).not.toHaveBeenCalled()
      expect(getHeader(wrapper).props('dialogVisible')).toBe(false)
    })

    describe('when the update fails', () => {
      it('flags a duplicate name and keeps the dialog open on DuplicateEntityError', async () => {
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValue(new DuplicateEntityError())
        const wrapper = mountComponent()
        await openDialog(wrapper)

        await submitEdit(wrapper)

        expect(getHeader(wrapper).props('isDuplicateName')).toBe(true)
        expect(getHeader(wrapper).props('dialogVisible')).toBe(true)
        expect(notificationMock.error).not.toHaveBeenCalled()
        expect(notificationMock.success).not.toHaveBeenCalled()
      })

      it('clears the duplicate name error when GroupHeader emits clear-duplicate-error', async () => {
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValue(new DuplicateEntityError())
        const wrapper = mountComponent()
        await submitEdit(wrapper)
        expect(getHeader(wrapper).props('isDuplicateName')).toBe(true)

        getHeader(wrapper).vm.$emit('clear-duplicate-error')
        await flushPromises()

        expect(getHeader(wrapper).props('isDuplicateName')).toBe(false)
      })

      it('resets the duplicate name error after a subsequent successful submit', async () => {
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValueOnce(new DuplicateEntityError())
          .mockResolvedValueOnce(undefined)
        const wrapper = mountComponent()
        await openDialog(wrapper)

        await submitEdit(wrapper)
        expect(getHeader(wrapper).props('isDuplicateName')).toBe(true)

        await submitEdit(wrapper)

        expect(getHeader(wrapper).props('isDuplicateName')).toBe(false)
        expect(getHeader(wrapper).props('dialogVisible')).toBe(false)
      })

      it('shows the userMessage for a DomainError that has one', async () => {
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValue(new DomainError('message', 'userMessage'))
        const wrapper = mountComponent()
        await openDialog(wrapper)

        await submitEdit(wrapper)

        expect(notificationMock.error).toHaveBeenCalledWith('userMessage')
        expect(getHeader(wrapper).props('isDuplicateName')).toBe(false)
        expect(getHeader(wrapper).props('dialogVisible')).toBe(true)
      })

      it('shows the userMessage for a ServerError that has one', async () => {
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValue(new ServerError('userMessage'))
        const wrapper = mountComponent()

        await submitEdit(wrapper)

        expect(notificationMock.error).toHaveBeenCalledWith('userMessage')
      })

      it('falls back to a default message for a ServerError without a userMessage', async () => {
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValue(new ServerError())
        const wrapper = mountComponent()

        await submitEdit(wrapper)

        expect(notificationMock.error).toHaveBeenCalledWith(
          'Failed to update the group',
        )
      })

      it('shows a default message for an unknown error and keeps the dialog open', async () => {
        groupStore.updateGroupDetails = vi
          .fn()
          .mockRejectedValue(new Error('unexpected'))
        const wrapper = mountComponent()
        await openDialog(wrapper)

        await submitEdit(wrapper)

        expect(notificationMock.error).toHaveBeenCalledWith(
          'Failed to update the group',
        )
        expect(notificationMock.success).not.toHaveBeenCalled()
        expect(getHeader(wrapper).props('dialogVisible')).toBe(true)
      })

      it('shows a default message when a non-Error value is thrown', async () => {
        groupStore.updateGroupDetails = vi.fn().mockRejectedValue('nope')
        const wrapper = mountComponent()

        await submitEdit(wrapper)

        expect(notificationMock.error).toHaveBeenCalledWith(
          'Failed to update the group',
        )
      })
    })
  })
})
