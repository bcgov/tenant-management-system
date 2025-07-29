import { authenticatedAxios } from './authenticated.axios'
import { isDuplicateEntityError, isValidationError, logApiError } from './utils'
import { DuplicateEntityError, ValidationError } from '@/errors'
import { type TenantRequestDetailFields, User } from '@/models'

const api = authenticatedAxios()

export const tenantRequestService = {
  /**
   * Creates a new tenant request with the specified details and user.
   *
   * @param {TenantRequestDetailFields} tenantRequestDetails - The details of
   *   the tenant request to create.
   * @param {User} user - The user that is creating the tenant request.
   * @throws Will throw an error if the API request fails.
   */
  async createTenantRequest(
    tenantRequestDetails: TenantRequestDetailFields,
    user: User,
  ) {
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
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   tenant-request-like objects.
   * @throws Will throw an error if the API request fails.
   */
  async getTenantRequests() {
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
   * @param {string} requestId - The ID of the tenant request to update.
   * @param {string} status - The new status (APPROVED, REJECTED, etc.).
   * @param {string} [rejectionReason] - Optional rejection reason (required for
   *   REJECTED status).
   * @throws Will throw an error if the API request fails.
   */
  async updateTenantRequestStatus(
    requestId: string,
    status: string,
    rejectionReason?: string,
  ) {
    try {
      const requestBody: {
        status: string
        rejectionReason?: string
      } = {
        status,
      }

      if (rejectionReason) {
        requestBody.rejectionReason = rejectionReason
      }

      await api.patch(`/tenant-requests/${requestId}/status`, requestBody)
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
