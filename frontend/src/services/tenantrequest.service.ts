import { authenticatedAxios } from '@/services/authenticated.axios'
import {
  isDuplicateEntityError,
  isValidationError,
  logApiError,
} from '@/services/utils'
import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ValidationError } from '@/errors/domain/ValidationError'
import {
  type TenantRequestApiData,
  type TenantRequestDetailFields,
  type TenantRequestId,
} from '@/models/tenantrequest.model'
import { type User } from '@/models/user.model'

const api = authenticatedAxios()

export const tenantRequestService = {
  /**
   * Creates a new tenant request with the specified details and user.
   *
   * @param tenantRequestDetails - The details of the tenant request to create.
   * @param user - The user that is creating the tenant request.
   * @returns A promise that resolves when the request succeeds.
   * @throws Will throw an error if the API request fails.
   */
  async createTenantRequest(
    tenantRequestDetails: TenantRequestDetailFields,
    user: User,
  ): Promise<void> {
    try {
      const requestBody = {
        description: tenantRequestDetails.description,
        ministryName: tenantRequestDetails.ministryName,
        name: tenantRequestDetails.name,
        user: {
          displayName: user.ssoUser.displayName,
          email: user.ssoUser.email,
          firstName: user.ssoUser.firstName,
          lastName: user.ssoUser.lastName,
          ssoUserId: user.ssoUser.ssoUserId,
          userName: user.ssoUser.userName,
        },
      }

      await api.post(`/tenant-requests`, requestBody)
    } catch (error: unknown) {
      logApiError('Error creating tenant request', error)

      // Handle HTTP 400 Bad Request (validation)
      if (isValidationError(error)) {
        const messageArray = error.response.data.details.body.map(
          (item: { message: string }) => item.message,
        )

        throw new ValidationError(messageArray)
      }

      // Handle HTTP 409 Conflict (duplicate)
      if (isDuplicateEntityError(error)) {
        throw new DuplicateEntityError(error.response.data.message)
      }

      // Re-throw all other errors
      throw error
    }
  },

  /**
   * Retrieves all the tenant requests.
   *
   * @returns A promise that resolves to an array of tenant request data.
   * @throws Will throw an error if the API request fails.
   */
  async getTenantRequests(): Promise<TenantRequestApiData[]> {
    try {
      const response = await api.get('/tenant-requests')

      return response.data.data.tenantRequests
    } catch (error) {
      logApiError('Error getting tenant requests', error)

      throw error
    }
  },

  /**
   * Updates the status of a tenant request.
   *
   * @param tenantRequestId - The ID of the tenant request to update.
   * @param status - The new status (APPROVED, REJECTED, etc.).
   * @param rejectionReason - Optional rejection reason (required for REJECTED
   *     status).
   * @param tenantName - The new tenant name used when there is a name clash.
   * @returns A promise that resolves when the request succeeds.
   * @throws Will throw an error if the API request fails.
   */
  async updateTenantRequestStatus(
    tenantRequestId: TenantRequestId,
    status: string,
    rejectionReason?: string,
    tenantName?: string,
  ): Promise<void> {
    try {
      const requestBody: {
        status: string
        rejectionReason?: string
        tenantName?: string
      } = {
        status,
      }

      if (rejectionReason) {
        requestBody.rejectionReason = rejectionReason
      }

      if (tenantName) {
        requestBody.tenantName = tenantName
      }

      await api.patch(`/tenant-requests/${tenantRequestId}/status`, requestBody)
    } catch (error: unknown) {
      logApiError('Error updating tenant request status', error)

      // Handle HTTP 400 Bad Request (validation)
      if (isValidationError(error)) {
        const messageArray = error.response.data.details.body.map(
          (item: { message: string }) => item.message,
        )

        throw new ValidationError(messageArray)
      }

      // Handle HTTP 409 Conflict (duplicate)
      if (isDuplicateEntityError(error)) {
        throw new DuplicateEntityError(error.response.data.message)
      }

      // Re-throw all other errors
      throw error
    }
  },
}
