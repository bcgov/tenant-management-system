import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeService, makeTenant } from '@/__tests__/__factories__'

import TenantServiceContainer from '@/components/route/TenantServiceContainer.vue'
import { useNotification } from '@/composables/useNotification'
import { toServiceId } from '@/models/service.model'
import { toTenantId } from '@/models/tenant.model'
import vuetify from '@/plugins/vuetify'
import { useServiceStore } from '@/stores/useServiceStore'
import { useTenantStore } from '@/stores/useTenantStore'

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(),
}))

const loginContainerStub = {
  name: 'LoginContainer',
  template: '<div><slot /></div>',
}

const loadingWrapperStub = {
  name: 'LoadingWrapper',
  props: ['loading', 'loadingMessage'],
  template: '<div><slot v-if="!loading" /></div>',
}

const child = (wrapper: ReturnType<typeof mountComponent>) => {
  return wrapper.getComponent({ name: 'ServiceManagement' })
}

const mountComponent = (tenantId = 'tenantId1') => {
  return mount(TenantServiceContainer, {
    global: {
      plugins: [vuetify],
      stubs: {
        LoginContainer: loginContainerStub,
        LoadingWrapper: loadingWrapperStub,
        ServiceManagement: true,
      },
    },
    props: { tenantId: toTenantId(tenantId) },
  })
}

describe('TenantServiceContainer', () => {
  let serviceStore: ReturnType<typeof useServiceStore>
  let tenantStore: ReturnType<typeof useTenantStore>
  let notificationMock: ReturnType<typeof useNotification>

  beforeEach(() => {
    setActivePinia(createPinia())
    serviceStore = useServiceStore()
    tenantStore = useTenantStore()

    tenantStore.getTenant = vi
      .fn()
      .mockReturnValue(makeTenant({ id: toTenantId('tenantId1') }))

    serviceStore.fetchServices = vi.fn().mockResolvedValue(undefined)
    serviceStore.fetchTenantServices = vi.fn().mockResolvedValue(undefined)

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

  describe('tenant computed', () => {
    it('reports an error when the tenant cannot be found', async () => {
      tenantStore.getTenant = vi.fn().mockReturnValue(undefined)
      const errorHandler = vi.fn()

      mount(TenantServiceContainer, {
        global: {
          plugins: [vuetify],
          stubs: {
            LoginContainer: loginContainerStub,
            LoadingWrapper: loadingWrapperStub,
            ServiceManagement: true,
          },
          config: { errorHandler },
        },
        props: { tenantId: toTenantId('tenantId1') },
      })
      await flushPromises()

      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Tenant tenantId1 not found' }),
        expect.anything(),
        expect.any(String),
      )
    })
  })

  describe('init', () => {
    it('calls fetchServices and fetchTenantServices on mount', async () => {
      mountComponent()
      await flushPromises()

      expect(serviceStore.fetchServices).toHaveBeenCalled()
      expect(serviceStore.fetchTenantServices).toHaveBeenCalledWith(
        toTenantId('tenantId1'),
      )
    })

    it('does not render ServiceManagement until both fetches settle', async () => {
      let resolveServices!: () => void
      serviceStore.fetchServices = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveServices = () => resolve()
          }),
      )

      const wrapper = mountComponent()

      expect(
        wrapper.findComponent({ name: 'ServiceManagement' }).exists(),
      ).toBe(false)

      resolveServices()
      await flushPromises()

      expect(
        wrapper.findComponent({ name: 'ServiceManagement' }).exists(),
      ).toBe(true)
    })

    it('shows error notification when fetchServices fails', async () => {
      serviceStore.fetchServices = vi.fn().mockRejectedValue(new Error('fail'))

      mountComponent()
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load services',
      )
    })

    it('shows error notification when fetchTenantServices fails', async () => {
      serviceStore.fetchTenantServices = vi
        .fn()
        .mockRejectedValue(new Error('fail'))

      mountComponent()
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load tenant services',
      )
    })

    it('shows both error notifications when both fetches fail', async () => {
      serviceStore.fetchServices = vi.fn().mockRejectedValue(new Error('fail'))
      serviceStore.fetchTenantServices = vi
        .fn()
        .mockRejectedValue(new Error('fail'))

      mountComponent()
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load services',
      )
      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to load tenant services',
      )
    })

    it('sets initialized even when both fetches fail', async () => {
      serviceStore.fetchServices = vi.fn().mockRejectedValue(new Error('fail'))
      serviceStore.fetchTenantServices = vi
        .fn()
        .mockRejectedValue(new Error('fail'))

      const wrapper = mountComponent()
      await flushPromises()

      expect(
        wrapper.findComponent({ name: 'ServiceManagement' }).exists(),
      ).toBe(true)
    })
  })

  describe('services computed', () => {
    it('passes services sorted alphabetically by displayName', async () => {
      serviceStore.services = [
        makeService({ displayName: 'Zebra Service' }),
        makeService({ displayName: 'Apple Service' }),
        makeService({ displayName: 'Mango Service' }),
      ]

      const wrapper = mountComponent()
      await flushPromises()

      expect(
        child(wrapper)
          .props('services')
          .map((s: { displayName: string }) => s.displayName),
      ).toEqual(['Apple Service', 'Mango Service', 'Zebra Service'])
    })
  })

  describe('tenantServices computed', () => {
    it('passes tenant services sorted alphabetically by displayName', async () => {
      serviceStore.tenantServices = [
        makeService({ displayName: 'Zebra Service' }),
        makeService({ displayName: 'Apple Service' }),
      ]

      const wrapper = mountComponent()
      await flushPromises()

      expect(
        child(wrapper)
          .props('tenantServices')
          .map((s: { displayName: string }) => s.displayName),
      ).toEqual(['Apple Service', 'Zebra Service'])
    })
  })

  describe('handleAddService', () => {
    it('calls addServiceToTenant, adds service to tenantServices, and shows success notification', async () => {
      const service = makeService({
        displayName: 'displayName',
        id: toServiceId('serviceId1'),
      })
      serviceStore.services = [service]
      serviceStore.tenantServices = []
      serviceStore.addServiceToTenant = vi.fn().mockResolvedValue(service)

      const wrapper = mountComponent()
      await flushPromises()

      await child(wrapper).vm.$emit('add-service', service.id)
      await flushPromises()

      expect(serviceStore.addServiceToTenant).toHaveBeenCalledWith(
        toTenantId('tenantId1'),
        service.id,
      )
      expect(notificationMock.success).toHaveBeenCalledWith(
        'displayName has been added to this tenant.',
      )
    })

    it('does not update tenantServices or notify success when the added service is not found locally', async () => {
      serviceStore.services = []
      serviceStore.tenantServices = []
      serviceStore.addServiceToTenant = vi.fn().mockResolvedValue(undefined)

      const wrapper = mountComponent()
      await flushPromises()

      await child(wrapper).vm.$emit(
        'add-service',
        toServiceId('unknownService'),
      )
      await flushPromises()

      expect(serviceStore.addServiceToTenant).toHaveBeenCalled()
      expect(notificationMock.success).not.toHaveBeenCalled()
      expect(child(wrapper).props('tenantServices')).toEqual([])
    })

    it('shows error notification when addServiceToTenant fails', async () => {
      serviceStore.addServiceToTenant = vi
        .fn()
        .mockRejectedValue(new Error('fail'))

      const wrapper = mountComponent()
      await flushPromises()

      await child(wrapper).vm.$emit('add-service', toServiceId('service1'))
      await flushPromises()

      expect(notificationMock.error).toHaveBeenCalledWith(
        'Failed to add service to tenant',
      )
    })
  })
})
