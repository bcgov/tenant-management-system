import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  SharedServicesArray,
  GroupServiceRoles,
  SharedServiceRoles,
} from '@/models'

import * as utils from '@/services/utils'

vi.mock('@/services/utils', () => ({
  logApiError: vi.fn(),
}))

const mockedUtils = vi.mocked(utils)

mockedUtils.logApiError.mockImplementation(() => {})

// Create mock functions in vi.hoisted to ensure they're available during module loading
const { mockGet, mockPost, mockPut, mockDelete, mockPatch } = vi.hoisted(
  () => ({
    mockGet: vi.fn(),
    mockPost: vi.fn(),
    mockPut: vi.fn(),
    mockDelete: vi.fn(),
    mockPatch: vi.fn(),
  }),
)

// Mock the authenticated axios to return an object with HTTP methods
vi.mock('@/services/authenticated.axios', () => ({
  authenticatedAxios: () => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
    patch: mockPatch,
  }),
}))

import { serviceService } from '@/services/service.service'

describe('serviceService', () => {
  const tenantId = '1'
  const serviceId = '123'

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

  describe('getAllSharedServices', () => {
    it('should return all shared services on success', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { sharedServices: fakeSharedServices } },
      })

      const result = await serviceService.getAllSharedServices()

      expect(result).toEqual(fakeSharedServices)
      expect(mockGet).toHaveBeenCalledWith('/shared-services')
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch shared services')
      mockGet.mockRejectedValueOnce(error)

      await expect(serviceService.getAllSharedServices()).rejects.toThrow(error)
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
        'Error getting tenant shared services',
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
    const groupId = '1'

    it('should return tenant group services on success', async () => {
      const groupId = '1'
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
        'Error getting tenant shared services',
        error,
      )
    })
  })

  describe('updateTenantGroupServices', () => {
    const fakeSharedServices: SharedServicesArray[] = [
      new SharedServicesArray('c7c82cb9-6344-4864-be39-19ffb03d105f', [
        new SharedServiceRoles('c7c82cb9-6344-4864-be39-19ffb03d105f', true),
      ]),
    ]
    const fakeUpdateData: GroupServiceRoles = new GroupServiceRoles(
      fakeSharedServices,
    )
    const groupId = '1'

    it('should return tenant group services on success', async () => {
      const groupId = '1'
      mockPut.mockResolvedValueOnce({ data: { data: {} } })

      const result = await serviceService.updateTenantGroupServices(
        tenantId,
        groupId,
        fakeUpdateData,
      )

      expect(result).toEqual({})
      expect(mockPut).toHaveBeenCalledWith(
        `/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`,
        fakeUpdateData,
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch tenant services')
      mockPut.mockRejectedValueOnce(error)

      await expect(
        serviceService.updateTenantGroupServices(
          tenantId,
          groupId,
          fakeUpdateData,
        ),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error updating shared services to group',
        error,
      )
    })
  })
})
