import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ValidationError } from '@/errors/domain/ValidationError'
import { type RoleApiData, type RoleId } from '@/models/role.model'
import { type TenantApiData, type TenantId } from '@/models/tenant.model'
import { User, type UserApiData, type UserId } from '@/models/user.model'
import { authenticatedAxios } from '@/services/authenticated.axios'
import {
  isDuplicateEntityError,
  isValidationError,
  logApiError,
} from '@/services/utils'

const api = authenticatedAxios()

export const tenantService = {
  /**
   * Adds a user to the specified tenant.
   *
   * Note: The format of the user in the request body differs from elsewhere,
   * so it requires explicit construction.
   *
   * @param tenantId - The unique identifier of the tenant.
   * @param user - The user to add.
   * @returns A promise that resolves to the user data.
   * @throws Will throw an error if the API request fails.
   */
  async addUser(tenantId: TenantId, user: User): Promise<UserApiData> {
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
          idpType: user.ssoUser.idpType,
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
   * Removes a user from the specified tenant.
   *
   * @param tenantId - The unique identifier of the tenant.
   * @param userId - The id of the user to remove
   * @returns A promise that resolves when the request succeeds.
   * @throws Will throw an error if the API request fails.
   */
  async removeUser(tenantId: TenantId, userId: UserId): Promise<void> {
    try {
      await api.delete(`/tenants/${tenantId}/users/${userId}`)
    } catch (error: unknown) {
      logApiError('Error removing user from tenant', error)

      // Handle HTTP 409 Conflict (cannot remove last owner)
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
   * @param roleIds - The unique identifier of the role to assign.
   * @returns A promise that resolves when the request succeeds.
   * @throws An error if the API request fails.
   */
  async assignUserRoles(
    tenantId: TenantId,
    userId: UserId,
    roleIds: Array<RoleId>,
  ): Promise<void> {
    try {
      const data = {
        roles: roleIds,
      }

      await api.post(`/tenants/${tenantId}/users/${userId}/roles`, data)
    } catch (error) {
      logApiError('Error assigning user role in tenant', error)

      throw error
    }
  },

  /**
   * Creates a new tenant with the specified name and ministry.
   *
   * @param name - The name of the tenant to create.
   * @param ministryName - The name of the ministry associated with the tenant.
   * @param user - The user that is creating the tenant.
   * @returns A promise that resolves to the tenant data.
   * @throws Will throw an error if the API request fails.
   */
  async createTenant(
    name: string,
    ministryName: string,
    user: User,
  ): Promise<TenantApiData> {
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
   * @param tenantId - The ID of the tenant.
   * @returns A promise that resolves to the tenant data.
   * @throws Will throw an error if the API request fails.
   */
  async getTenant(tenantId: TenantId): Promise<TenantApiData> {
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
   * @param tenantId - The unique identifier of the tenant.
   * @returns A promise that resolves to an array of role data.
   * @throws Will throw an error if the API request fails.
   */
  async getTenantRoles(tenantId: TenantId): Promise<RoleApiData[]> {
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
   * @param tenantId - The unique identifier of the tenant.
   * @param userId - The unique identifier of the user.
   * @returns A promise that resolves to an array of role data.
   * @throws Will throw an error if the API request fails.
   */
  async getUserRoles(
    tenantId: TenantId,
    userId: UserId,
  ): Promise<RoleApiData[]> {
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
   * @param userId - The SSO user ID of the user.
   * @returns A promise that resolves to an array of tenant data.
   * @throws Will throw an error if the API request fails.
   */
  async getUserTenants(userId: UserId): Promise<TenantApiData[]> {
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
   * @param tenantId - The unique identifier of the tenant.
   * @returns A promise that resolves to an array of user data.
   * @throws Will throw an error if the API request fails.
   */
  async getUsers(tenantId: TenantId): Promise<UserApiData[]> {
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
   * @returns A promise that resolves when the request succeeds.
   * @throws An error if the API request fails.
   */
  async removeUserRole(
    tenantId: TenantId,
    userId: UserId,
    roleId: RoleId,
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
   * @param tenantId - The ID of the tenant to update.
   * @param name - The new name of the tenant.
   * @param ministryName - The new ministry name for the tenant.
   * @param description - The new description for the tenant.
   * @returns A promise that resolves to the tenant data.
   * @throws Will throw an error if the API request fails.
   */
  async updateTenant(
    tenantId: TenantId,
    name: string,
    ministryName: string,
    description: string,
  ): Promise<TenantApiData> {
    try {
      const requestBody = {
        description: description,
        ministryName: ministryName,
        name: name,
      }

      const response = await api.put(`/tenants/${tenantId}`, requestBody)

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
