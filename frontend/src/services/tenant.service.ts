import { authenticatedAxios } from './authenticated.axios'
import { isDuplicateEntityError, isValidationError, logApiError } from './utils'
import { DuplicateEntityError, ValidationError } from '@/errors'
import { User } from '@/models'

const api = authenticatedAxios()

export const tenantService = {
  /**
   * Adds a user to the specified tenant.
   *
   * Note: The format of the user in the request body differs from elsewhere,
   * so it requires explicit construction.
   *
   * @param {string} tenantId - The unique identifier of the tenant.
   * @param {User} user - The user to add.
   * @returns {Promise<object>} A promise resolving to the added user object.
   * @throws Will throw an error if the API request fails.
   */
  async addUser(tenantId: string, user: User) {
    try {
      // It's a little tricky that the format of the user here is unlike
      // anywhere else, so we need to construct the request body.
      const request = {
        roles: user.roles.map((r) => r.id),
        user: {
          displayName: user.ssoUser.displayName,
          email: user.ssoUser.email,
          firstName: user.ssoUser.firstName,
          lastName: user.ssoUser.lastName,
          ssoUserId: user.ssoUser.ssoUserId,
          userName: user.ssoUser.userName,
        },
      }

      const response = await api.post(`/tenants/${tenantId}/users`, request)

      return response.data.data.user
    } catch (error: unknown) {
      logApiError('Error adding user to tenant', error)

      // Handle HTTP 409 Conflict (duplicate)
      if (isDuplicateEntityError(error)) {
        throw new DuplicateEntityError(error.response.data.message)
      }

      throw error
    }
  },

  /**
   * Assigns a role to a user within a specific tenant.
   *
   * This sends a PUT request to the API endpoint to assign the given role
   * to the specified user in the tenant. If the request fails, the error
   * is logged and rethrown.
   *
   * @param tenantId - The unique identifier of the tenant.
   * @param userId - The unique identifier of the user.
   * @param roleId - The unique identifier of the role to assign.
   * @returns A promise that resolves when the role is successfully assigned.
   * @throws An error if the API request fails.
   */
  async assignUserRoles(
    tenantId: string,
    userId: string,
    roleId: string,
  ): Promise<void> {
    try {
      await api.put(`/tenants/${tenantId}/users/${userId}/roles/${roleId}`)
    } catch (error) {
      logApiError('Error assigning user role in tenant', error)

      throw error
    }
  },

  /**
   * Creates a new tenant with the specified name and ministry.
   *
   * @param {string} name - The name of the tenant to create.
   * @param {string} ministryName - The name of the ministry associated with the
   *   tenant.
   * @param {User} user - The user that is creating the tenant.
   * @returns {Promise<object>} A promise that resolves to the newly created
   *   tenant-like object.
   * @throws Will throw an error if the API request fails.
   */
  async createTenant(name: string, ministryName: string, user: User) {
    try {
      const requestBody = {
        ministryName,
        name,
        user: {
          displayName: user.ssoUser.displayName,
          email: user.ssoUser.email,
          firstName: user.ssoUser.firstName,
          lastName: user.ssoUser.lastName,
          ssoUserId: user.ssoUser.ssoUserId,
          userName: user.ssoUser.userName,
        },
      }

      const response = await api.post(`/tenants`, requestBody)

      return response.data.data.tenant
    } catch (error: unknown) {
      logApiError('Error creating tenant', error)

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
   * Retrieves the specified tenant.
   *
   * @param {string} tenantId - The ID of the tenant.
   * @returns {Promise<object>} A promise that resolves a tenant-like object.
   * @throws Will throw an error if the API request fails.
   */
  async getTenant(tenantId: string) {
    try {
      const response = await api.get(
        `/tenants/${tenantId}?expand=tenantUserRoles`,
      )

      return response.data.data.tenant
    } catch (error) {
      logApiError('Error getting tenant', error)

      throw error
    }
  },

  /**
   * Retrieves the roles assigned within a specific tenant.
   *
   * @param {string} tenantId - The unique identifier of the tenant.
   * @returns {Promise<object[]>} A promise that resolves to an array of role-like
   *   objects.
   * @throws Will throw an error if the API request fails.
   */
  async getTenantRoles(tenantId: string) {
    try {
      const response = await api.get(`/tenants/${tenantId}/roles`)

      return response.data.data.roles
    } catch (error) {
      logApiError('Error getting tenant roles', error)

      throw error
    }
  },

  /**
   * Retrieves the roles assigned to a user within a specific tenant.
   *
   * @param {string} tenantId - The unique identifier of the tenant.
   * @param {string} userId - The unique identifier of the user.
   * @returns {Promise<object[]>} A promise that resolves to an array of role-like
   *   objects.
   * @throws Will throw an error if the API request fails.
   */
  async getUserRoles(tenantId: string, userId: string) {
    try {
      const response = await api.get(
        `/tenants/${tenantId}/users/${userId}/roles`,
      )

      return response.data.data.roles
    } catch (error) {
      logApiError('Error getting tenant users roles', error)

      throw error
    }
  },

  /**
   * Retrieves the tenants associated with the specified user.
   *
   * @param {string} userId - The SSO user ID of the user.
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   tenant-like objects.
   * @throws Will throw an error if the API request fails.
   */
  async getUserTenants(userId: string) {
    try {
      const response = await api.get(
        `/users/${userId}/tenants?expand=tenantUserRoles`,
      )

      return response.data.data.tenants
    } catch (error) {
      logApiError('Error getting users tenants', error)

      throw error
    }
  },

  /**
   * Retrieves all users associated with a specified tenant.
   *
   * @param {string} tenantId - The unique identifier of the tenant.
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   user-like objects.
   * @throws Will throw an error if the API request fails.
   */
  async getUsers(tenantId: string) {
    try {
      const response = await api.get(`/tenants/${tenantId}/users`)

      return response.data.data.users
    } catch (error) {
      logApiError('Error getting tenant users', error)

      throw error
    }
  },

  /**
   * Removes a role from a user within a specific tenant.
   *
   * This sends a DELETE request to the API endpoint to unassign the given role
   * from the specified user in the tenant. If the request fails, the error
   * is logged and rethrown.
   *
   * @param tenantId - The unique identifier of the tenant.
   * @param userId - The unique identifier of the user.
   * @param roleId - The unique identifier of the role to remove.
   * @returns A promise that resolves when the role is successfully removed.
   * @throws An error if the API request fails.
   */
  async removeUserRole(
    tenantId: string,
    userId: string,
    roleId: string,
  ): Promise<void> {
    try {
      await api.delete(`/tenants/${tenantId}/users/${userId}/roles/${roleId}`)
    } catch (error) {
      logApiError('Error removing user role from tenant', error)

      throw error
    }
  },

  /**
   * Updates an existing tenant with the specified details.
   *
   * @param {string} id - The ID of the tenant to update.
   * @param {string} name - The new name of the tenant.
   * @param {string} ministryName - The new ministry name for the tenant.
   * @param {string} description - The new description for the tenant.
   * @returns {Promise<object>} A promise that resolves to the updated tenant
   *   object.
   * @throws Will throw an error if the API request fails.
   */
  async updateTenant(
    id: string,
    name: string,
    ministryName: string,
    description: string,
  ) {
    try {
      const requestBody = {
        description: description,
        ministryName: ministryName,
        name: name,
      }

      const response = await api.put(`/tenants/${id}`, requestBody)

      return response.data.data.tenant
    } catch (error: unknown) {
      logApiError('Error updating tenant', error)

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
