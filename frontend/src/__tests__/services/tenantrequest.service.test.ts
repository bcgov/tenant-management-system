import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as utils from '@/services/utils'

vi.mock('@/services/utils', () => ({
  isDuplicateEntityError: vi.fn(),
  isValidationError: vi.fn(),
  logApiError: vi.fn(),
}))

const mockedUtils = vi.mocked(utils)

mockedUtils.isDuplicateEntityError.mockReturnValue(false)
mockedUtils.isValidationError.mockReturnValue(false)
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

import { DuplicateEntityError, ValidationError } from '@/errors'
import { type TenantRequestDetailFields, User } from '@/models'
import { tenantRequestService } from '@/services'

describe('tenantRequestService', () => {
  const requestId = '123'
  const ssoUserId = '789'

  const fakeUser: User = {
    id: '1',
    ssoUser: {
      displayName: 'John Doe',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      ssoUserId: ssoUserId,
      userName: 'johndoe',
    },
    roles: [],
  }

  const fakeTenantRequestDetails: TenantRequestDetailFields = {
    name: 'Test Tenant Request',
    ministryName: 'Test Ministry',
    description: 'This is a test tenant request',
  }

  const fakeTenantRequest = {
    id: requestId,
    name: fakeTenantRequestDetails.name,
    ministryName: fakeTenantRequestDetails.ministryName,
    description: fakeTenantRequestDetails.description,
    status: 'PENDING',
    user: fakeUser.ssoUser,
    createdAt: '2024-01-01T00:00:00Z',
  }

  const fakeTenantRequests = [
    fakeTenantRequest,
    {
      id: '124',
      name: 'Another Request',
      ministryName: 'Another Ministry',
      description: 'Another test request',
      status: 'APPROVED',
      user: fakeUser.ssoUser,
      createdAt: '2024-01-02T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTenantRequest', () => {
    it('should successfully create tenant request', async () => {
      mockPost.mockResolvedValueOnce({})

      await tenantRequestService.createTenantRequest(
        fakeTenantRequestDetails,
        fakeUser,
      )

      expect(mockPost).toHaveBeenCalledWith('/tenant-requests', {
        description: fakeTenantRequestDetails.description,
        ministryName: fakeTenantRequestDetails.ministryName,
        name: fakeTenantRequestDetails.name,
        user: {
          displayName: fakeUser.ssoUser.displayName,
          email: fakeUser.ssoUser.email,
          firstName: fakeUser.ssoUser.firstName,
          lastName: fakeUser.ssoUser.lastName,
          ssoUserId: fakeUser.ssoUser.ssoUserId,
          userName: fakeUser.ssoUser.userName,
        },
      })
    })

    it('should throw ValidationError on HTTP 400', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            details: {
              body: [
                { message: 'Name is required' },
                { message: 'Ministry name cannot be empty' },
              ],
            },
          },
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isValidationError.mockReturnValueOnce(true)

      await expect(
        tenantRequestService.createTenantRequest(
          fakeTenantRequestDetails,
          fakeUser,
        ),
      ).rejects.toBeInstanceOf(ValidationError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error creating tenant request',
        error,
      )
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 409,
          data: { message: 'Tenant request with this name already exists' },
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        tenantRequestService.createTenantRequest(
          fakeTenantRequestDetails,
          fakeUser,
        ),
      ).rejects.toBeInstanceOf(DuplicateEntityError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error creating tenant request',
        error,
      )
    })

    it('should log and rethrow unknown errors', async () => {
      const genericError = new Error('Network connection failed')
      mockPost.mockRejectedValueOnce(genericError)

      await expect(
        tenantRequestService.createTenantRequest(
          fakeTenantRequestDetails,
          fakeUser,
        ),
      ).rejects.toThrow(genericError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error creating tenant request',
        genericError,
      )
    })
  })

  describe('getTenantRequests', () => {
    it('should return all tenant requests on success', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { tenantRequests: fakeTenantRequests } },
      })

      const result = await tenantRequestService.getTenantRequests()

      expect(result).toEqual(fakeTenantRequests)
      expect(mockGet).toHaveBeenCalledWith('/tenant-requests')
    })

    it('should return empty array when no requests exist', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { tenantRequests: [] } },
      })

      const result = await tenantRequestService.getTenantRequests()

      expect(result).toEqual([])
      expect(mockGet).toHaveBeenCalledWith('/tenant-requests')
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch tenant requests')
      mockGet.mockRejectedValueOnce(error)

      await expect(tenantRequestService.getTenantRequests()).rejects.toThrow(
        error,
      )

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant requests',
        error,
      )
    })
  })

  describe('updateTenantRequestStatus', () => {
    const status = 'APPROVED'
    const rejectionReason = 'Does not meet requirements'

    it('should successfully update status without rejection reason', async () => {
      mockPatch.mockResolvedValueOnce({})

      await tenantRequestService.updateTenantRequestStatus(requestId, status)

      expect(mockPatch).toHaveBeenCalledWith(
        `/tenant-requests/${requestId}/status`,
        {
          status,
        },
      )
    })

    it('should successfully update status with rejection reason', async () => {
      const rejectedStatus = 'REJECTED'
      mockPatch.mockResolvedValueOnce({})

      await tenantRequestService.updateTenantRequestStatus(
        requestId,
        rejectedStatus,
        rejectionReason,
      )

      expect(mockPatch).toHaveBeenCalledWith(
        `/tenant-requests/${requestId}/status`,
        {
          status: rejectedStatus,
          rejectionReason,
        },
      )
    })

    it('should handle empty rejection reason by not including it', async () => {
      mockPatch.mockResolvedValueOnce({})

      await tenantRequestService.updateTenantRequestStatus(
        requestId,
        status,
        '',
      )

      expect(mockPatch).toHaveBeenCalledWith(
        `/tenant-requests/${requestId}/status`,
        {
          status,
        },
      )
    })

    it('should throw ValidationError on HTTP 400', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            details: {
              body: [
                { message: 'Invalid status value' },
                { message: 'Rejection reason is required for REJECTED status' },
              ],
            },
          },
        },
      }
      mockPatch.mockRejectedValueOnce(error)
      mockedUtils.isValidationError.mockReturnValueOnce(true)

      await expect(
        tenantRequestService.updateTenantRequestStatus(
          requestId,
          'INVALID_STATUS',
        ),
      ).rejects.toBeInstanceOf(ValidationError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error updating tenant request status',
        error,
      )
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 409,
          data: { message: 'Status update conflict' },
        },
      }
      mockPatch.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        tenantRequestService.updateTenantRequestStatus(requestId, status),
      ).rejects.toBeInstanceOf(DuplicateEntityError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error updating tenant request status',
        error,
      )
    })

    it('should log and rethrow unknown errors', async () => {
      const genericError = new Error('Database connection failed')
      mockPatch.mockRejectedValueOnce(genericError)

      await expect(
        tenantRequestService.updateTenantRequestStatus(requestId, status),
      ).rejects.toThrow(genericError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error updating tenant request status',
        genericError,
      )
    })

    it('should handle concurrent update conflicts', async () => {
      const concurrencyError = {
        isAxiosError: true,
        response: {
          status: 409,
          data: {
            message: 'Request has already been processed by another user',
          },
        },
      }
      mockPatch.mockRejectedValueOnce(concurrencyError)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        tenantRequestService.updateTenantRequestStatus(requestId, status),
      ).rejects.toBeInstanceOf(DuplicateEntityError)
    })

    it('should handle undefined rejection reason correctly', async () => {
      mockPatch.mockResolvedValueOnce({})

      await tenantRequestService.updateTenantRequestStatus(requestId, status)

      expect(mockPatch).toHaveBeenCalledWith(
        `/tenant-requests/${requestId}/status`,
        {
          status,
        },
      )
    })
  })
})
