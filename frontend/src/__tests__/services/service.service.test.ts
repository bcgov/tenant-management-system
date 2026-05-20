import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeGroupService, makeGroupServiceRole } from '../__factories__/index'

import { type GroupId } from '@/models/group.model'
import { type ServiceId } from '@/models/service.model'
import { type TenantId } from '@/models/tenant.model'
import * as utils from '@/services/utils'

vi.mock('@/services/utils', () => ({
  logApiError: vi.fn(),
}))

const mockedUtils = vi.mocked(utils)

mockedUtils.logApiError.mockImplementation(() => {})

// Create mock functions in vi.hoisted to ensure they're available during module
// loading.
const { mockDelete, mockGet, mockPatch, mockPost, mockPut } = vi.hoisted(
  () => ({
    mockDelete: vi.fn(),
    mockGet: vi.fn(),
    mockPatch: vi.fn(),
    mockPost: vi.fn(),
    mockPut: vi.fn(),
  }),
)

// Mock the authenticated axios to return an object with HTTP methods
vi.mock('@/services/authenticated.axios', () => ({
  authenticatedAxios: () => ({
    delete: mockDelete,
    get: mockGet,
    patch: mockPatch,
    post: mockPost,
    put: mockPut,
  }),
}))

import { serviceService } from '@/services/service.service'

describe('serviceService', () => {
  const tenantId = '1' as TenantId
  const serviceId = '123' as ServiceId

  const fakeSharedService = {
    id: serviceId,
    name: 'Test Service',
    description: 'Test service description',
    url: 'https://test-service.example.com',
    isActive: true,
  }

  const fakeSharedServices = [
    fakeSharedService,
    {
      id: '124',
      name: 'Another Service',
      description: 'Another test service',
      url: 'https://another-service.example.com',
      isActive: true,
    },
  ]

  const fakeTenantServiceResponse = {
    tenantId,
    sharedServiceId: serviceId,
    sharedService: fakeSharedService,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getServices', () => {
    it('should return all connected services on success', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { sharedServices: fakeSharedServices } },
      })

      const result = await serviceService.getServices()

      expect(result).toEqual(fakeSharedServices)
      expect(mockGet).toHaveBeenCalledWith('/shared-services')
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch connected services')
      mockGet.mockRejectedValueOnce(error)

      await expect(serviceService.getServices()).rejects.toThrow(error)
    })
  })

  describe('addServiceToTenant', () => {
    it('should return the result on successful service addition', async () => {
      mockPost.mockResolvedValueOnce({
        data: { data: fakeTenantServiceResponse },
      })

      const result = await serviceService.addServiceToTenant(
        tenantId,
        serviceId,
      )

      expect(result).toEqual(fakeTenantServiceResponse)
      expect(mockPost).toHaveBeenCalledWith(
        `/tenants/${tenantId}/shared-services`,
        {
          sharedServiceId: serviceId,
        },
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to add service to tenant')
      mockPost.mockRejectedValueOnce(error)

      await expect(
        serviceService.addServiceToTenant(tenantId, serviceId),
      ).rejects.toThrow(error)
    })
  })

  describe('getTenantServices', () => {
    it('should return tenant services on success', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { sharedServices: fakeSharedServices } },
      })

      const result = await serviceService.getTenantServices(tenantId)

      expect(result).toEqual(fakeSharedServices)
      expect(mockGet).toHaveBeenCalledWith(
        `/tenants/${tenantId}/shared-services`,
      )
    })

    it('should return empty array when tenant has no services', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { sharedServices: [] } },
      })

      const result = await serviceService.getTenantServices(tenantId)

      expect(result).toEqual([])
      expect(mockGet).toHaveBeenCalledWith(
        `/tenants/${tenantId}/shared-services`,
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch tenant services')
      mockGet.mockRejectedValueOnce(error)

      await expect(serviceService.getTenantServices(tenantId)).rejects.toThrow(
        error,
      )

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant services',
        error,
      )
    })
  })

  describe('getTenantGroupServices', () => {
    const fakeSharedGroupServices = {
      id: 'f454ab17-c0dd-46b3-8bce-b56874df57f4',
      name: 'CHEFS',
      clientIdentifier: 'tenant-management-system-6014',
      description: 'chefs service local',
      createdDateTime: '2025-10-29',
      updatedDateTime: '2025-10-29',
      createdBy: 'B1SHARRA                        ',
      updatedBy: 'B1SHARRA                        ',
      sharedServiceRoles: [
        {
          id: 'c7c82cb9-6344-4864-be39-19ffb03d105f',
          name: 'Admin',
          description: 'does admin things',
          enabled: false,
          createdDateTime: '2025-10-29',
          createdBy: 'B1SHARRA                        ',
        },
      ],
    }

    const groupId = '1' as GroupId

    it('should return tenant group services on success', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { sharedServices: fakeSharedGroupServices } },
      })

      const result = await serviceService.getTenantGroupServices(
        tenantId,
        groupId,
      )

      expect(result).toEqual(fakeSharedGroupServices)
      expect(mockGet).toHaveBeenCalledWith(
        `/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`,
      )
    })

    it('should return empty array when tenant has no services', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { sharedServices: [] } },
      })

      const result = await serviceService.getTenantGroupServices(
        tenantId,
        groupId,
      )

      expect(result).toEqual([])
      expect(mockGet).toHaveBeenCalledWith(
        `/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`,
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch tenant services')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        serviceService.getTenantGroupServices(tenantId, groupId),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant group services',
        error,
      )
    })
  })

  describe('updateTenantGroupServices', () => {
    const fakeServices = [
      makeGroupService({
        roles: [
          makeGroupServiceRole({ id: 'id1' }),
          makeGroupServiceRole({ id: 'id2', isEnabled: false }),
        ],
      }),
    ]
    const groupId = '1' as GroupId

    it('should return tenant group services on success', async () => {
      mockPut.mockResolvedValueOnce({ data: { data: {} } })

      const result = await serviceService.updateTenantGroupServiceRoles(
        tenantId,
        groupId,
        fakeServices,
      )

      expect(result).toEqual({})
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch tenant services')
      mockPut.mockRejectedValueOnce(error)

      await expect(
        serviceService.updateTenantGroupServiceRoles(
          tenantId,
          groupId,
          fakeServices,
        ),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error updating tenant group service roles',
        error,
      )
    })
  })
})
