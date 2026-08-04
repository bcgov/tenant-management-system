import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import {
  makeService,
  makeServiceApiData,
  makeServiceDetailFields,
  makeServiceRole,
  makeServiceRoleApiData,
} from '@/__tests__/__factories__'

import { toServiceId } from '@/models/service.model'
import { toServiceRoleId } from '@/models/servicerole.model'
import { toTenantId } from '@/models/tenant.model'
import { serviceService } from '@/services/service.service'
import { useServiceStore } from '@/stores/useServiceStore'

vi.mock('@/services/service.service', () => ({
  serviceService: {
    addServiceToTenant: vi.fn(),
    createService: vi.fn(),
    getServices: vi.fn(),
    getTenantServices: vi.fn(),
  },
}))

describe('useServiceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with default values', () => {
    const store = useServiceStore()

    expect(store.loading).toBe(false)
    expect(store.tenantServices).toEqual([])
  })

  describe('addServiceToTenant', () => {
    it.todo('adds a service to the tenant', async () => {
      const store = useServiceStore()

      expect(store.tenantServices).toHaveLength(0)

      await store.addServiceToTenant(
        toTenantId('tenantId'),
        toServiceId('serviceId'),
      )

      expect(store.tenantServices).toHaveLength(1)
      expect(store.tenantServices[1].id).toBe('serviceId')
    })

    it('does not alter the state on api error', async () => {
      const store = useServiceStore()
      vi.mocked(serviceService.addServiceToTenant).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.tenantServices).toHaveLength(0)

      await expect(
        store.addServiceToTenant(
          toTenantId('tenantId'),
          toServiceId('serviceId'),
        ),
      ).rejects.toThrow()

      expect(store.tenantServices).toHaveLength(0)
    })
  })

  describe('createService', () => {
    it('creates a new service in the store', async () => {
      const store = useServiceStore()
      const serviceDetailFields = makeServiceDetailFields({
        clientIdentifier: 'serviceClientIdentifier',
        description: 'serviceDescription',
        displayName: 'serviceDisplayName',
        landingPageUrl: 'serviceLandingPageUrl',
        name: 'serviceName',
        roles: [
          makeServiceRole({
            description: 'serviceRoleDescription',
            identityProviders: ['serviceRoleIdentityProvider'],
            name: 'serviceRoleName',
          }),
        ],
      })
      const serviceApiData = makeServiceApiData({
        clientIdentifier: 'serviceClientIdentifier',
        createdDateTime: 'serviceCreatedDateTime',
        description: 'serviceDescription',
        displayName: 'serviceDisplayName',
        id: toServiceId('serviceId'),
        landingPageUrl: 'serviceLandingPageUrl',
        name: 'serviceName',
        roles: [
          makeServiceRoleApiData({
            allowedIdentityProviders: ['serviceRoleIdentityProvider'],
            createdBy: 'serviceRoleCreatedBy',
            createdDateTime: 'serviceRoleCreatedDateTime',
            description: 'serviceRoleDescription',
            id: toServiceRoleId('serviceRoleId'),
            isDeleted: false,
            name: 'serviceRoleName',
          }),
        ],
        updatedDateTime: 'serviceUpdatedDateTime',
      })
      vi.mocked(serviceService.createService).mockResolvedValue(serviceApiData)

      expect(store.services).toHaveLength(0)

      await store.createService(serviceDetailFields)

      expect(store.services[0].clientIdentifier).toBe('serviceClientIdentifier')
      expect(store.services[0].createdDate).toBe('serviceCreatedDateTime')
      expect(store.services[0].description).toBe('serviceDescription')
      expect(store.services[0].displayName).toBe('serviceDisplayName')
      expect(store.services[0].id).toBe('serviceId')
      expect(store.services[0].landingPageUrl).toBe('serviceLandingPageUrl')
      expect(store.services[0].name).toBe('serviceName')
      expect(store.services[0].roles).toHaveLength(1)
      expect(store.services[0].roles[0].identityProviders).toHaveLength(1)
      expect(store.services[0].roles[0].identityProviders[0]).toBe(
        'serviceRoleIdentityProvider',
      )
      expect(store.services[0].roles[0].createdBy).toBe('serviceRoleCreatedBy')
      expect(store.services[0].roles[0].createdDate).toBe(
        'serviceRoleCreatedDateTime',
      )
      expect(store.services[0].roles[0].description).toBe(
        'serviceRoleDescription',
      )
      expect(store.services[0].roles[0].id).toBe('serviceRoleId')
      expect(store.services[0].roles[0].isDeleted).toBe(false)
      expect(store.services[0].roles[0].name).toBe('serviceRoleName')
      expect(store.services[0].updatedDate).toBe('serviceUpdatedDateTime')
    })

    it('does not alter the state on api error', async () => {
      const store = useServiceStore()
      const service = makeService({
        clientIdentifier: 'serviceClientIdentifier',
        createdDate: 'serviceCreatedDate',
        description: 'serviceDescription',
        displayName: 'serviceDisplayName',
        id: toServiceId('serviceId'),
        landingPageUrl: 'serviceLandingPageUrl',
        name: 'serviceName',
        roles: [makeServiceRole()],
        updatedDate: 'serviceUpdatedDate',
      })
      store.services = [service]
      const serviceDetailFields = makeServiceDetailFields({
        clientIdentifier: 'serviceClientIdentifier',
        description: 'serviceDescription',
        displayName: 'serviceDisplayName',
        landingPageUrl: 'serviceLandingPageUrl',
        name: 'serviceName',
        roles: [
          makeServiceRole({
            description: 'serviceRoleDescription',
            identityProviders: ['serviceRoleIdentityProvider'],
            name: 'serviceRoleName',
          }),
        ],
      })
      vi.mocked(serviceService.createService).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.services).toHaveLength(1)
      expect(store.services[0].clientIdentifier).toBe('serviceClientIdentifier')
      expect(store.services[0].createdDate).toBe('serviceCreatedDate')
      expect(store.services[0].description).toBe('serviceDescription')
      expect(store.services[0].displayName).toBe('serviceDisplayName')
      expect(store.services[0].id).toBe('serviceId')
      expect(store.services[0].landingPageUrl).toBe('serviceLandingPageUrl')
      expect(store.services[0].name).toBe('serviceName')
      expect(store.services[0].roles).toHaveLength(1)
      expect(store.services[0].updatedDate).toBe('serviceUpdatedDate')

      await expect(store.createService(serviceDetailFields)).rejects.toThrow()

      expect(store.services).toHaveLength(1)
      expect(store.services[0].clientIdentifier).toBe('serviceClientIdentifier')
      expect(store.services[0].createdDate).toBe('serviceCreatedDate')
      expect(store.services[0].description).toBe('serviceDescription')
      expect(store.services[0].displayName).toBe('serviceDisplayName')
      expect(store.services[0].id).toBe('serviceId')
      expect(store.services[0].landingPageUrl).toBe('serviceLandingPageUrl')
      expect(store.services[0].name).toBe('serviceName')
      expect(store.services[0].roles).toHaveLength(1)
      expect(store.services[0].updatedDate).toBe('serviceUpdatedDate')
    })
  })

  describe('fetchServices', () => {
    it('manages loading state', async () => {
      const store = useServiceStore()
      vi.mocked(serviceService.getServices).mockResolvedValue([
        makeServiceApiData(),
      ])

      expect(store.loading).toBe(false)

      const promise = store.fetchServices()

      expect(store.loading).toBe(true)

      await promise

      expect(store.loading).toBe(false)
    })

    it('clears loading state on error', async () => {
      const store = useServiceStore()
      vi.mocked(serviceService.getServices).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.loading).toBe(false)

      await expect(store.fetchServices()).rejects.toThrow()

      expect(store.loading).toBe(false)
    })

    it.todo('overwrites store with results', async () => {
      const store = useServiceStore()
      store.services = [makeService({ id: toServiceId('serviceId') })]
      vi.mocked(serviceService.getServices).mockResolvedValue([
        makeServiceApiData({ id: toServiceId('serviceId2') }),
      ])

      await store.fetchServices()

      expect(store.services).toHaveLength(1)
      expect(store.services[0].id).toBe('serviceId2')
    })

    it('does not alter the state on api error', async () => {
      const store = useServiceStore()
      store.services = [
        makeService({
          clientIdentifier: 'serviceClientIdentifier',
          createdDate: 'serviceCreatedDate',
          description: 'serviceDescription',
          displayName: 'serviceDisplayName',
          id: toServiceId('serviceId'),
          landingPageUrl: 'serviceLandingPageUrl',
          name: 'serviceName',
          roles: [makeServiceRole()],
          updatedDate: 'serviceUpdatedDate',
        }),
      ]
      vi.mocked(serviceService.getServices).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.services).toHaveLength(1)
      expect(store.services[0].clientIdentifier).toBe('serviceClientIdentifier')
      expect(store.services[0].createdDate).toBe('serviceCreatedDate')
      expect(store.services[0].description).toBe('serviceDescription')
      expect(store.services[0].displayName).toBe('serviceDisplayName')
      expect(store.services[0].id).toBe('serviceId')
      expect(store.services[0].landingPageUrl).toBe('serviceLandingPageUrl')
      expect(store.services[0].name).toBe('serviceName')
      expect(store.services[0].roles).toHaveLength(1)
      expect(store.services[0].updatedDate).toBe('serviceUpdatedDate')

      await expect(store.fetchServices()).rejects.toThrow()

      expect(store.services).toHaveLength(1)
      expect(store.services[0].clientIdentifier).toBe('serviceClientIdentifier')
      expect(store.services[0].createdDate).toBe('serviceCreatedDate')
      expect(store.services[0].description).toBe('serviceDescription')
      expect(store.services[0].displayName).toBe('serviceDisplayName')
      expect(store.services[0].id).toBe('serviceId')
      expect(store.services[0].landingPageUrl).toBe('serviceLandingPageUrl')
      expect(store.services[0].name).toBe('serviceName')
      expect(store.services[0].roles).toHaveLength(1)
      expect(store.services[0].updatedDate).toBe('serviceUpdatedDate')
    })
  })

  describe('fetchTenantServices', () => {
    it('manages loading state', async () => {
      const store = useServiceStore()
      vi.mocked(serviceService.getTenantServices).mockResolvedValue([
        makeServiceApiData(),
      ])

      expect(store.loading).toBe(false)

      const promise = store.fetchTenantServices(toTenantId('tenantId'))

      expect(store.loading).toBe(true)

      await promise

      expect(store.loading).toBe(false)
    })

    it('clears loading state on error', async () => {
      const store = useServiceStore()
      vi.mocked(serviceService.getTenantServices).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.loading).toBe(false)

      await expect(
        store.fetchTenantServices(toTenantId('tenantId')),
      ).rejects.toThrow()

      expect(store.loading).toBe(false)
    })

    it('overwrites store with results', async () => {
      const store = useServiceStore()
      const service = makeService({
        clientIdentifier: 'serviceClientIdentifier',
        createdDate: 'serviceCreatedDate',
        description: 'serviceDescription',
        displayName: 'serviceDisplayName',
        id: toServiceId('serviceId'),
        landingPageUrl: 'serviceLandingPageUrl',
        name: 'serviceName',
        roles: [makeServiceRole()],
        updatedDate: 'serviceUpdatedDate',
      })
      store.tenantServices = [service]
      const serviceApiData = makeServiceApiData({
        clientIdentifier: 'serviceClientIdentifier2',
        createdDateTime: 'serviceCreatedDateTime2',
        description: 'serviceDescription2',
        displayName: 'serviceDisplayName2',
        id: toServiceId('serviceId2'),
        landingPageUrl: 'serviceLandingPageUrl2',
        name: 'serviceName2',
        roles: [makeServiceRoleApiData(), makeServiceRoleApiData()],
        updatedDateTime: 'serviceUpdatedDateTime2',
      })
      vi.mocked(serviceService.getTenantServices).mockResolvedValue([
        serviceApiData,
      ])

      expect(store.tenantServices).toHaveLength(1)
      expect(store.tenantServices[0].clientIdentifier).toBe(
        'serviceClientIdentifier',
      )
      expect(store.tenantServices[0].createdDate).toBe('serviceCreatedDate')
      expect(store.tenantServices[0].description).toBe('serviceDescription')
      expect(store.tenantServices[0].displayName).toBe('serviceDisplayName')
      expect(store.tenantServices[0].id).toBe('serviceId')
      expect(store.tenantServices[0].landingPageUrl).toBe(
        'serviceLandingPageUrl',
      )
      expect(store.tenantServices[0].name).toBe('serviceName')
      expect(store.tenantServices[0].roles).toHaveLength(1)
      expect(store.tenantServices[0].updatedDate).toBe('serviceUpdatedDate')

      await store.fetchTenantServices(toTenantId('tenantId'))

      expect(store.tenantServices).toHaveLength(1)
      expect(store.tenantServices[0].clientIdentifier).toBe(
        'serviceClientIdentifier2',
      )
      expect(store.tenantServices[0].createdDate).toBe(
        'serviceCreatedDateTime2',
      )
      expect(store.tenantServices[0].description).toBe('serviceDescription2')
      expect(store.tenantServices[0].displayName).toBe('serviceDisplayName2')
      expect(store.tenantServices[0].id).toBe('serviceId2')
      expect(store.tenantServices[0].landingPageUrl).toBe(
        'serviceLandingPageUrl2',
      )
      expect(store.tenantServices[0].name).toBe('serviceName2')
      expect(store.tenantServices[0].roles).toHaveLength(2)
      expect(store.tenantServices[0].updatedDate).toBe(
        'serviceUpdatedDateTime2',
      )
    })
  })

  describe('getTenantService', () => {
    it('returns the tenant service', () => {
      const store = useServiceStore()
      const service = makeService({
        id: toServiceId('tenantServiceId'),
      })
      store.tenantServices = [service]

      const returnedService = store.getTenantService(
        toServiceId('tenantServiceId'),
      )

      expect(returnedService).toBeDefined()
      expect(returnedService?.id).toBe('tenantServiceId')
    })

    it('returns undefined if not found', () => {
      const store = useServiceStore()
      const service = makeService({
        id: toServiceId('tenantServiceId'),
      })
      store.tenantServices = [service]

      const returnedService = store.getTenantService(
        toServiceId('tenantServiceId2'),
      )

      expect(returnedService).toBeUndefined()
    })
  })
})
