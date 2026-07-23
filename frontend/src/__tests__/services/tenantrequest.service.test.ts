import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  makeRole,
  makeSsoUser,
  makeTenantRequestApiData,
  makeTenantRequestDetailFields,
  makeUser,
} from '@/__tests__/__factories__'

import { toRoleId } from '@/models/role.model'
import { toTenantRequestId } from '@/models/tenantrequest.model'
import { toUserId } from '@/models/user.model'
import { toSsoUserId } from '@/models/ssouser.model'
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

const { mockGet, mockPatch, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
  mockPost: vi.fn(),
}))

vi.mock('@/services/authenticated.axios', () => ({
  authenticatedAxios: () => ({
    get: mockGet,
    patch: mockPatch,
    post: mockPost,
  }),
}))

import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ValidationError } from '@/errors/domain/ValidationError'
import { tenantRequestService } from '@/services/tenantrequest.service'

describe('tenantRequestService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createTenantRequest', () => {
    it('should correctly call the api', async () => {
      const tenantRequestDetails = makeTenantRequestDetailFields({
        description: 'tenantRequestDescription',
        ministryName: 'tenantRequestMinistryName',
        name: 'tenantRequestName',
      })
      const user = makeUser({
        id: toUserId('userId'),
        roles: [
          makeRole({
            description: 'roleDescription',
            id: toRoleId('roleId'),
            name: 'roleName',
          }),
        ],
        ssoUser: makeSsoUser({
          displayName: 'ssoUserDisplayName',
          email: 'ssoUserEmail',
          firstName: 'ssoUserFirstName',
          idpType: 'ssoUserIdpType',
          lastName: 'ssoUserLastName',
          ssoUserId: toSsoUserId('ssoUserSsoUserId'),
          userName: 'ssoUserUserName',
        }),
      })
      mockPost.mockResolvedValueOnce({})

      await tenantRequestService.createTenantRequest(tenantRequestDetails, user)

      expect(mockPost).toHaveBeenCalledWith('/tenant-requests', {
        description: 'tenantRequestDescription',
        ministryName: 'tenantRequestMinistryName',
        name: 'tenantRequestName',
        user: {
          displayName: 'ssoUserDisplayName',
          email: 'ssoUserEmail',
          firstName: 'ssoUserFirstName',
          lastName: 'ssoUserLastName',
          ssoUserId: 'ssoUserSsoUserId',
          userName: 'ssoUserUserName',
        },
      })
    })

    it('should throw ValidationError on HTTP 400', async () => {
      const error = {
        isAxiosError: true,
        response: {
          data: {
            details: {
              body: [
                { message: 'Name is required' },
                { message: 'Ministry name cannot be empty' },
              ],
            },
          },
          status: 400,
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isValidationError.mockReturnValueOnce(true)

      await expect(
        tenantRequestService.createTenantRequest(
          makeTenantRequestDetailFields(),
          makeUser(),
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
          data: { message: 'Tenant request with this name already exists' },
          status: 409,
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        tenantRequestService.createTenantRequest(
          makeTenantRequestDetailFields(),
          makeUser(),
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
          makeTenantRequestDetailFields(),
          makeUser(),
        ),
      ).rejects.toThrow(genericError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error creating tenant request',
        genericError,
      )
    })
  })

  describe('getTenantRequests', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: {} } })

      await tenantRequestService.getTenantRequests()

      expect(mockGet).toHaveBeenCalledWith('/tenant-requests')
    })

    it('should correctly return data', async () => {
      const tenantRequestApiData = makeTenantRequestApiData({
        createdBy: 'tenantRequestCreatedBy',
        createdDateTime: 'tenantRequestCreatedDateTime',
        description: 'tenantRequestDescription',
        id: toTenantRequestId('tenantRequestId'),
        ministryName: 'tenantRequestMinistryName',
        name: 'tenantRequestName',
        rejectionReason: 'tenantRequestRejectionReason',
        status: 'tenantRequestStatus',
      })
      mockGet.mockResolvedValueOnce({
        data: { data: { tenantRequests: [tenantRequestApiData] } },
      })

      const result = await tenantRequestService.getTenantRequests()

      expect(result).toHaveLength(1)
      expect(result[0].createdBy).toBe('tenantRequestCreatedBy')
      expect(result[0].createdDateTime).toBe('tenantRequestCreatedDateTime')
      expect(result[0].description).toBe('tenantRequestDescription')
      expect(result[0].id).toBe('tenantRequestId')
      expect(result[0].ministryName).toBe('tenantRequestMinistryName')
      expect(result[0].name).toBe('tenantRequestName')
      expect(result[0].rejectionReason).toBe('tenantRequestRejectionReason')
      expect(result[0].status).toBe('tenantRequestStatus')
    })

    it('should return empty array when no requests exist', async () => {
      mockGet.mockResolvedValueOnce({
        data: { data: { tenantRequests: [] } },
      })

      const result = await tenantRequestService.getTenantRequests()

      expect(result).toEqual([])
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
    it('should correctly call the api', async () => {
      mockPatch.mockResolvedValueOnce({})

      await tenantRequestService.updateTenantRequestStatus(
        toTenantRequestId('tenantRequestId'),
        'APPROVED',
      )

      expect(mockPatch).toHaveBeenCalledWith(
        '/tenant-requests/tenantRequestId/status',
        {
          status: 'APPROVED',
        },
      )
    })

    it('should correctly call the api with rejection reason', async () => {
      mockPatch.mockResolvedValueOnce({})

      await tenantRequestService.updateTenantRequestStatus(
        toTenantRequestId('tenantRequestId'),
        'REJECTED',
        'rejectionReason',
      )

      expect(mockPatch).toHaveBeenCalledWith(
        '/tenant-requests/tenantRequestId/status',
        {
          rejectionReason: 'rejectionReason',
          status: 'REJECTED',
        },
      )
    })

    it('should correctly call the api with new name', async () => {
      mockPatch.mockResolvedValueOnce({})

      await tenantRequestService.updateTenantRequestStatus(
        toTenantRequestId('tenantRequestId'),
        'APPROVED',
        undefined,
        'newTenantRequestName',
      )

      expect(mockPatch).toHaveBeenCalledWith(
        '/tenant-requests/tenantRequestId/status',
        {
          tenantName: 'newTenantRequestName',
          status: 'APPROVED',
        },
      )
    })

    it('should handle empty rejection reason by not including it', async () => {
      mockPatch.mockResolvedValueOnce({})

      await tenantRequestService.updateTenantRequestStatus(
        toTenantRequestId('tenantRequestId'),
        'APPROVED',
        '',
      )

      expect(mockPatch).toHaveBeenCalledWith(
        '/tenant-requests/tenantRequestId/status',
        {
          status: 'APPROVED',
        },
      )
    })

    it('should handle empty name by not including it', async () => {
      mockPatch.mockResolvedValueOnce({})

      await tenantRequestService.updateTenantRequestStatus(
        toTenantRequestId('tenantRequestId'),
        'APPROVED',
        undefined,
        '',
      )

      expect(mockPatch).toHaveBeenCalledWith(
        '/tenant-requests/tenantRequestId/status',
        {
          status: 'APPROVED',
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
          toTenantRequestId('tenantRequestId'),
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
          data: { message: 'Status update conflict' },
          status: 409,
        },
      }
      mockPatch.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        tenantRequestService.updateTenantRequestStatus(
          toTenantRequestId('tenantRequestId'),
          'APPROVED',
        ),
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
        tenantRequestService.updateTenantRequestStatus(
          toTenantRequestId('tenantRequestId'),
          'APPROVED',
        ),
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
          data: {
            message: 'Request has already been processed by another user',
          },
          status: 409,
        },
      }
      mockPatch.mockRejectedValueOnce(concurrencyError)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        tenantRequestService.updateTenantRequestStatus(
          toTenantRequestId('tenantRequestId'),
          'APPROVED',
        ),
      ).rejects.toBeInstanceOf(DuplicateEntityError)
    })

    it('should handle undefined rejection reason correctly', async () => {
      mockPatch.mockResolvedValueOnce({})

      await tenantRequestService.updateTenantRequestStatus(
        toTenantRequestId('tenantRequestId'),
        'REJECTED',
      )

      expect(mockPatch).toHaveBeenCalledWith(
        '/tenant-requests/tenantRequestId/status',
        {
          status: 'REJECTED',
        },
      )
    })
  })
})
