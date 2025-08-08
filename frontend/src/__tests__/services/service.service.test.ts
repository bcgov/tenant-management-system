import { beforeEach, describe, expect, it, vi } from 'vitest'

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
})
