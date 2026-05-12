import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { makeService } from '@/__tests__/__factories__'

import {
  Service,
  type ServiceApiData,
  toServiceId,
} from '@/models/service.model'
import { type TenantId } from '@/models/tenant.model'
import { serviceService } from '@/services/service.service'
import { useServiceStore } from '@/stores/useServiceStore'

vi.mock('@/services/service.service', () => ({
  serviceService: {
    addServiceToTenant: vi.fn(),
    getAllSharedServices: vi.fn(),
    getTenantServices: vi.fn(),
  },
}))

describe('Service Store', () => {
  const tenantId = 't-1' as TenantId
  const serviceId = toServiceId('s-123')

  const mockServiceApiData: ServiceApiData = {
    clientIdentifier: 'client-1',
    createdBy: 'user-1',
    createdDateTime: '2023-01-01T12:00:00Z',
    description: 'Test Service Description',
    id: serviceId,
    isActive: true,
    name: 'Test Service',
    roles: [],
    updatedDateTime: '2023-01-02T12:00:00Z',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with default values', () => {
    const store = useServiceStore()
    expect(store.services).toEqual([])
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
    it('manages loading state and returns mapped services without updating state', async () => {
      const store = useServiceStore()
      vi.mocked(serviceService.getAllSharedServices).mockResolvedValue([
        mockServiceApiData,
      ])

      const promise = store.fetchServices()

      expect(store.loading).toBe(true)

      const result = await promise

      expect(store.loading).toBe(false)
      expect(result).toHaveLength(1)
      expect(result[0]).toBeInstanceOf(Service)
      expect(store.services).toHaveLength(0)
    })

    it('sets loading to false even if fetch fails', async () => {
      const store = useServiceStore()
      vi.mocked(serviceService.getAllSharedServices).mockRejectedValue(
        new Error('Fail'),
      )

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

      const result = await store.fetchTenantServices(tenantId)

      expect(store.loading).toBe(false)
      expect(result).toHaveLength(1)
      expect(store.services).toHaveLength(1)
      expect(store.services[0].id).toBe(serviceId)
      expect(store.services[0]).toBeInstanceOf(Service)
    })

    it('updates existing services in state (upsert branch)', async () => {
      const store = useServiceStore()
      const existing = makeService({ id: serviceId, name: 'Old Name' })
      store.services = [existing]
      const updatedApiData: ServiceApiData = {
        ...mockServiceApiData,
        name: 'Updated Name',
      }
      vi.mocked(serviceService.getTenantServices).mockResolvedValue([
        updatedApiData,
      ])

      await store.fetchTenantServices(tenantId)

      expect(store.services).toHaveLength(1)
      expect(store.services[0].name).toBe('Updated Name')
    })
  })

  describe('getService', () => {
    it('retrieves the correct service from state', () => {
      const store = useServiceStore()
      const service = makeService({ id: serviceId })
      store.services = [service]

      expect(store.getService(serviceId)).toStrictEqual(service)

      expect(store.getService(toServiceId('fake'))).toBeUndefined()
    })

    it('uses the find iterator correctly (coverage for getService)', () => {
      const store = useServiceStore()
      const s1 = makeService({ id: toServiceId('s1') })
      const s2 = makeService({ id: toServiceId('s2') })
      store.services = [s1, s2]

      const result = store.getService(toServiceId('s2'))

      expect(result).toStrictEqual(s2)
    })
  })
})
