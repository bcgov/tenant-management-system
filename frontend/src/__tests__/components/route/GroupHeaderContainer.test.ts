import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  makeGroup,
  makeGroupService,
  makeGroupServiceRole,
  makeTenant,
} from '@/__tests__/__factories__'

import GroupHeaderContainer from '@/components/route/GroupHeaderContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { toGroupId } from '@/models/group.model'
import { toGroupServiceRoleId } from '@/models/groupservicerole.model'
import { toTenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { toGroupServiceId } from '@/models/groupservice.model'

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

    notificationMock = {
      items: [],

      info: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
      remove: vi.fn(),
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
})
