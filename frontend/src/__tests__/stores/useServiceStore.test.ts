import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { makeService } from '@/__tests__/__factories__'

import { type ServiceApiData } from '@/mappers/service.mapper'
import { Service, toServiceId } from '@/models/service.model'
import { toTenantId } from '@/models/tenant.model'
import { serviceService } from '@/services/service.service'
import { useServiceStore } from '@/stores/useServiceStore'

vi.mock('@/services/service.service', () => ({
  serviceService: {
    addServiceToTenant: vi.fn(),
    getServices: vi.fn(),
    getTenantServices: vi.fn(),
  },
}))

describe('Service Store', () => {
  const tenantId = toTenantId('t-1')
  const serviceId = toServiceId('s-1')
  const tenantServiceId = toServiceId('s-2')

  const mockServiceApiData: ServiceApiData = {
    clientIdentifier: 'client-1',
    createdDateTime: '2026-01-01',
    description: 'Test Service Description',
    displayName: 'Test Service Display Name',
    name: 'Test Service Name',
    landingPageUrl: 'https://test-service.com',
    id: serviceId,
    roles: [],
    updatedDateTime: '2026-01-02',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with default values', () => {
    const store = useServiceStore()
    expect(store.tenantServices).toEqual([])
    expect(store.loading).toBe(false)
  })

  describe('addServiceToTenant', () => {
    it('calls the service with correct parameters', async () => {
      const store = useServiceStore()
      await store.addServiceToTenant(tenantId, serviceId)
      expect(serviceService.addServiceToTenant).toHaveBeenCalledWith(
        tenantId,
        serviceId,
      )
    })
  })

  describe('fetchServices', () => {
    it('manages loading state and inserts state', async () => {
      const store = useServiceStore()
      store.services.push(
        makeService({ id: serviceId, displayName: 'firstName' }),
      )
      vi.mocked(serviceService.getServices).mockResolvedValue([
        mockServiceApiData,
      ])

      await store.fetchServices()

      expect(store.services).toHaveLength(1)
      expect(store.services[0].clientIdentifier).toBe(
        mockServiceApiData.clientIdentifier,
      )
      expect(store.services[0].createdDate).toBe(
        mockServiceApiData.createdDateTime,
      )
      expect(store.services[0].description).toBe(mockServiceApiData.description)
      expect(store.services[0].displayName).toBe(mockServiceApiData.displayName)
      expect(store.services[0].id).toBe(mockServiceApiData.id)
      expect(store.services[0].landingPageUrl).toBe(
        mockServiceApiData.landingPageUrl,
      )
      expect(store.services[0].name).toBe(mockServiceApiData.name)
      expect(store.services[0].updatedDate).toBe(
        mockServiceApiData.updatedDateTime,
      )
      expect(store.tenantServices).toHaveLength(0)
    })

    it('manages loading state and updates state', async () => {
      const store = useServiceStore()
      vi.mocked(serviceService.getServices).mockResolvedValue([
        mockServiceApiData,
      ])

      const promise = store.fetchServices()

      expect(store.loading).toBe(true)

      await promise

      expect(store.loading).toBe(false)
      expect(store.services).toHaveLength(1)
      expect(store.tenantServices).toHaveLength(0)
    })

    it('sets loading to false even if fetch fails', async () => {
      const store = useServiceStore()
      vi.mocked(serviceService.getServices).mockRejectedValue(new Error('Fail'))

      await expect(store.fetchServices()).rejects.toThrow('Fail')

      expect(store.loading).toBe(false)
    })
  })

  describe('fetchTenantServices', () => {
    it('manages loading and upserts services into state', async () => {
      const store = useServiceStore()
      vi.mocked(serviceService.getTenantServices).mockResolvedValue([
        mockServiceApiData,
      ])

      await store.fetchTenantServices(tenantId)

      expect(store.loading).toBe(false)
      expect(store.tenantServices).toHaveLength(1)
      expect(store.tenantServices[0].id).toBe(serviceId)
      expect(store.tenantServices[0]).toBeInstanceOf(Service)
    })

    it('updates existing services in state (upsert branch)', async () => {
      const store = useServiceStore()
      const existing = makeService({ id: serviceId, displayName: 'Old Name' })
      store.tenantServices = [existing]
      const updatedApiData: ServiceApiData = {
        ...mockServiceApiData,
        displayName: 'Updated Name',
      }
      vi.mocked(serviceService.getTenantServices).mockResolvedValue([
        updatedApiData,
      ])

      await store.fetchTenantServices(tenantId)

      expect(store.tenantServices).toHaveLength(1)
      expect(store.tenantServices[0].displayName).toBe('Updated Name')
    })
  })

  describe('getTenantService', () => {
    it('retrieves the correct tenant service from state', () => {
      const store = useServiceStore()
      const tenantService = makeService({ id: tenantServiceId })
      store.tenantServices = [tenantService]

      expect(store.getTenantService(tenantServiceId)).toStrictEqual(
        tenantService,
      )

      expect(store.getTenantService(toServiceId('fake'))).toBeUndefined()
    })

    it('uses the find iterator correctly (coverage for getService)', () => {
      const store = useServiceStore()
      const ts1 = makeService({ id: toServiceId('ts1') })
      const ts2 = makeService({ id: toServiceId('ts2') })
      store.tenantServices = [ts1, ts2]

      const result = store.getTenantService(toServiceId('ts2'))

      expect(result).toStrictEqual(ts2)
    })
  })
})
