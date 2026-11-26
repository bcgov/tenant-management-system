import { render, screen, waitFor } from '@testing-library/vue'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { makeGroup, makeTenant } from '@/__tests__/__factories__'

import TenantContainer from '@/components/route/TenantHeaderContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { toGroupId } from '@/models/group.model'
import { toTenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      children: [
        {
          path: '',
          component: { template: '<div />' },
        },
      ],
      component: TenantContainer,
      path: '/tenants/:tenantId',
    },
    {
      children: [
        {
          path: '',
          component: { template: '<div />' },
        },
      ],
      component: TenantContainer,
      path: '/tenants/:tenantId/group/:groupId',
    },
  ],
})

const loadingWrapperStub = {
  name: 'LoadingWrapper',
  props: ['loading', 'loadingMessage'],
  template: '<div><slot /></div>',
}

const tenantHeaderStub = {
  name: 'TenantHeader',
  props: ['groups', 'tenant'],
  template: `
    <div
      data-testid="tenant-header"
      :data-groups-count="groups.length"
      :data-tenant-id="tenant.id"
    />
  `,
}

// The route records use TenantContainer as their component, so an unstubbed
// <router-view /> would render a second TenantContainer inside the first.
const routerViewStub = {
  template: '<div data-testid="router-view" />',
}

const renderComponent = ({ tenantId = 'tenantIdDefault' } = {}) =>
  render(TenantContainer, {
    global: {
      plugins: [router],
      stubs: {
        LoadingWrapper: loadingWrapperStub,
        RouterView: routerViewStub,
        TenantHeader: tenantHeaderStub,
      },
    },
    props: { tenantId: toTenantId(tenantId) },
  })

describe('TenantContainer', () => {
  let groupStore: ReturnType<typeof useGroupStore>
  let tenantStore: ReturnType<typeof useTenantStore>

  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(async () => {
    setActivePinia(createPinia())

    groupStore = useGroupStore()
    groupStore.groups = []
    groupStore.fetchGroups = vi.fn().mockResolvedValue(undefined)

    tenantStore = useTenantStore()
    tenantStore.tenants = [makeTenant({ id: toTenantId('tenantIdDefault') })]
    tenantStore.fetchTenant = vi.fn().mockResolvedValue(undefined)

    notificationMock = {
      messages: ref([]),

      dismiss: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
    }
    vi.mocked(useNotification).mockReturnValue(notificationMock)

    await router.push('/tenants/tenantIdDefault')
    await router.isReady()
  })

  it('fetches groups and tenant on mount', async () => {
    tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]

    renderComponent({ tenantId: 'tenantId' })

    expect(groupStore.fetchGroups).toHaveBeenCalledWith(toTenantId('tenantId'))
    expect(tenantStore.fetchTenant).toHaveBeenCalledWith(toTenantId('tenantId'))
  })

  it('does not render TenantHeader when groupId exists', async () => {
    await router.push('/tenants/tenantId/group/groupId')

    renderComponent({ tenantId: 'tenantId' })

    expect(tenantStore.fetchTenant).toHaveBeenCalled()
    expect(screen.queryByTestId('tenant-header')).not.toBeInTheDocument()
  })

  it('renders TenantHeader when there is no groupId', async () => {
    renderComponent()

    expect(await screen.findByTestId('tenant-header')).toBeInTheDocument()
  })

  it('passes the tenant and groups to TenantHeader', async () => {
    groupStore.groups = [
      makeGroup({ id: toGroupId('groupId1') }),
      makeGroup({ id: toGroupId('groupId2') }),
    ]
    tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId') })]

    renderComponent({ tenantId: 'tenantId' })

    const header = await screen.findByTestId('tenant-header')
    expect(header).toHaveAttribute('data-tenant-id', 'tenantId')
    expect(header).toHaveAttribute('data-groups-count', '2')
  })

  it('renders the router view', () => {
    renderComponent()

    expect(screen.getByTestId('router-view')).toBeInTheDocument()
  })

  it('shows an error when loading groups fails', async () => {
    groupStore.fetchGroups = vi.fn().mockRejectedValue(new Error())

    renderComponent()

    await waitFor(() => {
      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load groups',
      )
    })
  })

  it('shows an error when loading tenant fails', async () => {
    tenantStore.fetchTenant = vi.fn().mockRejectedValue(new Error())

    renderComponent()

    await waitFor(() => {
      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load tenant',
      )
    })
  })
})
