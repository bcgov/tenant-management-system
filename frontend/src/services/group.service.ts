import { authenticatedAxios } from './authenticated.axios'
import { isDuplicateEntityError, isValidationError, logApiError } from './utils'
import { DuplicateEntityError, ValidationError } from '@/errors'

const api = authenticatedAxios()

export const groupService = {
  /**
   * Creates a new group with the specified name and description.
   *
   * @param {string} tenantId - The ID of the tenant that the group is created
   *   for.
   * @param {string} name - The name of the group to create.
   * @param {string} description - The description of the group.
   * @returns {Promise<object>} A promise that resolves to the newly created
   *   group-like object.
   * @throws Will throw an error if the API request fails.
   */
  async createGroup(tenantId: string, name: string, description: string) {
    try {
      const requestBody = {
        description,
        name,
      }

      const response = await api.post(
        `/tenants/${tenantId}/groups`,
        requestBody,
      )

      return response.data.data.group
    } catch (error: unknown) {
      logApiError('Error creating group', error)

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
   * Retrieves the specified group for a tenant.
   *
   * @param {string} tenantId - The ID of the tenant.
   * @param {string} groupId - The ID of the group within the tenant.
   * @returns {Promise<object>} A promise that resolves a group-like object.
   * @throws Will throw an error if the API request fails.
   */
  async getGroup(tenantId: string, groupId: string) {
    try {
      const response = await api.get(`/tenants/${tenantId}/group/${groupId}`)

      return response.data.data.group
    } catch (error) {
      logApiError('Error getting group', error)

      throw error
    }
  },

  /**
   * Retrieves the groups associated with the specified tenant.
   *
   * @param {string} tenantId - The ID of the tenant.
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   group-like objects.
   * @throws Will throw an error if the API request fails.
   */
  async getTenantGroups(tenantId: string) {
    try {
      const response = await api.get(`/tenants/${tenantId}/groups`)

      return response.data.data.groups
    } catch (error) {
      logApiError('Error getting tenant groups', error)

      throw error
    }
  },
}
