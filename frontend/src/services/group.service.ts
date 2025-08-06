import { authenticatedAxios } from './authenticated.axios'
import { DuplicateEntityError, ValidationError } from '@/errors'
import { User } from '@/models'
import { isDuplicateEntityError, isValidationError, logApiError } from './utils'

const api = authenticatedAxios()

export const groupService = {
  /**
   * Adds a user to an existing group within a tenant.
   *
   * @param {string} tenantId - The ID of the tenant.
   * @param {string} groupId - The ID of the group to add the user to.
   * @param {User} user - The user to add to the group.
   * @returns {Promise<object>} A promise that resolves to the response data.
   * @throws Will throw an error if the API request fails.
   */
  async addUserToGroup(tenantId: string, groupId: string, user: User) {
    try {
      const requestBody = {
        user: {
          displayName: user.ssoUser.displayName,
          email: user.ssoUser.email,
          firstName: user.ssoUser.firstName,
          lastName: user.ssoUser.lastName,
          ssoUserId: user.ssoUser.ssoUserId,
          userName: user.ssoUser.userName,
        },
      }

      const response = await api.post(
        `/tenants/${tenantId}/groups/${groupId}/users`,
        requestBody,
      )

      return response.data.data.groupUser
    } catch (error: unknown) {
      logApiError('Error adding user to group', error)

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
      const response = await api.get(
        `/tenants/${tenantId}/groups/${groupId}?expand=groupUsers`,
      )

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

  /**
   * Removes a user from an existing group within a tenant.
   *
   * @param {string} tenantId - The ID of the tenant.
   * @param {string} groupId - The ID of the group to remove the user from.
   * @param {string} groupUserId - The ID of the group user to remove.
   * @returns {Promise<void>} A promise that resolves when the user is
   *   successfully removed.
   * @throws Will throw an error if the API request fails.
   */
  async removeUserFromGroup(
    tenantId: string,
    groupId: string,
    groupUserId: string,
  ) {
    try {
      await api.delete(
        `/tenants/${tenantId}/groups/${groupId}/users/${groupUserId}`,
      )
    } catch (error: unknown) {
      logApiError('Error removing user from group', error)

      throw error
    }
  },

  /**
   * Updates an existing group with the specified details.
   *
   * @param {string} tenantId - The ID of the tenant that the group belongs to.
   * @param {string} groupId - The ID of the group to update.
   * @param {string} name - The new name of the group.
   * @param {string} description - The new description for the group.
   * @returns {Promise<object>} A promise that resolves to the updated group
   *   object.
   * @throws Will throw an error if the API request fails.
   */
  async updateGroup(
    tenantId: string,
    groupId: string,
    name: string,
    description: string,
  ) {
    try {
      const requestBody = {
        description: description,
        name: name,
      }

      const response = await api.put(
        `/tenants/${tenantId}/groups/${groupId}`,
        requestBody,
      )

      return response.data.data.group
    } catch (error: unknown) {
      logApiError('Error updating group', error)

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
