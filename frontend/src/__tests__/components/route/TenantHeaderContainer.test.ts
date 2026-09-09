import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import { makeTenant } from '@/__tests__/__factories__'

import TenantContainer from '@/components/route/TenantHeaderContainer.vue'
import { toTenantId } from '@/models/tenant.model'
import { useGroupStore } from '@/stores/useGroupStore'
import { useTenantStore } from '@/stores/useTenantStore'

import { useNotification } from '@/composables/useNotification'

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

const mountComponent = () =>
  mount(TenantContainer, {
    global: {
      plugins: [router],
      stubs: {
        LoadingWrapper: { template: '<div><slot /></div>' },
        LoginContainer: { template: '<div><slot /></div>' },
        TenantHeader: true,
      },
    },
    props: {
      tenantId: toTenantId('tenantId1'),
    },
  })

describe('TenantContainer', () => {
  let groupStore: ReturnType<typeof useGroupStore>
  let tenantStore: ReturnType<typeof useTenantStore>
  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(() => {
    setActivePinia(createPinia())

    groupStore = useGroupStore()
    groupStore.groups = []

    tenantStore = useTenantStore()
    tenantStore.tenants = [makeTenant({ id: toTenantId('tenantId1') })]

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

  it('fetches groups and tenant on mount', async () => {
    groupStore.fetchGroups = vi.fn().mockResolvedValue(undefined)
    tenantStore.fetchTenant = vi.fn().mockResolvedValue(undefined)

    mountComponent()
    await flushPromises()

    expect(groupStore.fetchGroups).toHaveBeenCalledWith(toTenantId('tenantId1'))
    expect(tenantStore.fetchTenant).toHaveBeenCalledWith(
      toTenantId('tenantId1'),
    )
  })

  it('does not render TenantHeader when groupId exists', async () => {
    await router.push('/tenants/tenantId1/group/groupId1')
    await router.isReady()

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.findComponent({ name: 'TenantHeader' }).exists()).toBe(false)
  })

  it('renders the child route', async () => {
    await router.push('/tenants/tenantId1')
    await router.isReady()

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.findComponent({ name: 'TenantHeader' }).exists()).toBe(true)
  })

  it('shows an error when loading groups fails', async () => {
    groupStore.fetchGroups = vi.fn().mockRejectedValue(new Error())
    tenantStore.fetchTenant = vi.fn().mockResolvedValue(undefined)

    mountComponent()
    await flushPromises()

    expect(notificationMock.error).toHaveBeenCalledWith('Failed to load groups')
  })

  it('shows an error when loading tenant fails', async () => {
    groupStore.fetchGroups = vi.fn().mockResolvedValue(undefined)
    tenantStore.fetchTenant = vi.fn().mockRejectedValue(new Error())

    mountComponent()
    await flushPromises()

    expect(notificationMock.error).toHaveBeenCalledWith('Failed to load tenant')
  })
})
