import axios from 'axios'

import { DuplicateEntityError, ValidationError } from '@/errors'
import { Role } from '@/models/role.model'
import { User } from '@/models/user.model'
import { authenticatedAxios } from '@/services/authenticated.axios'
import { config } from '@/services/config.service'
import { logger } from '@/utils/logger'

/**
 * Axios instance configured for tenant API requests.
 *
 */
const tenantApi = authenticatedAxios()
tenantApi.defaults.baseURL = config.api.baseUrl

/**
 * Logs an API error with a custom message.
 *
 * Differentiates between Axios errors and other error types for better logging
 *   detail.
 *
 * @param {string} message - A descriptive message to include in the log.
 * @param {unknown} error - The error object caught from an API call or other
 *   source.
 */
const logApiError = (message: string, error: unknown) => {
  if (axios.isAxiosError(error)) {
    logger.error(`${message}: ${error.message}`, error)
  } else {
    logger.error(message, error)
  }
}

export const tenantService = {
  /**
   * Creates a new tenant with the specified name and ministry.
   *
   * @param {string} name - The name of the tenant to create.
   * @param {string} ministryName - The name of the ministry associated with the
   *   tenant.
   * @param {string} user - The user that is creating the tenant.
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
          displayName: user.displayName,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          ssoUserId: user.id,
          userName: user.userName,
        },
      }

      const response = await tenantApi.post(`/tenants`, requestBody)

      return response.data.data.tenant
    } catch (error: any) {
      logApiError('Error creating Tenant', error)

      // Handle HTTP 400 Bad Request (validation)
      if (
        error.response?.status === 400 &&
        typeof error.response.data?.message === 'string'
      ) {
        const messageArray = error.response.data.details.body.map(
          (item: { message: string }) => item.message,
        )
        throw new ValidationError(messageArray)
      }

      // Handle HTTP 409 Conflict (duplicate)
      if (
        error.response?.status === 409 &&
        typeof error.response.data?.message === 'string'
      ) {
        throw new DuplicateEntityError(error.response.data.message)
      }

      // Re-throw all other errors
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
        id: id,
        description: description,
        ministryName: ministryName,
        name: name,
      }

      // const response = await tenantApi.put(`/tenants/${id}`, requestBody)

      // return response

      return {
        createdBy: 'TODO',
        createdDateTime: new Date().toISOString(),
        description: requestBody.description,
        id: id,
        name: requestBody.name,
        ministryName: requestBody.ministryName,
        users: [],
      }
    } catch (error: any) {
      logApiError('Error updating Tenant', error)

      // Handle HTTP 400 Bad Request (validation)
      if (
        error.response?.status === 400 &&
        typeof error.response.data?.message === 'string'
      ) {
        const messageArray = error.response.data.details.body.map(
          (item: { message: string }) => item.message,
        )
        throw new ValidationError(messageArray)
      }

      // Handle HTTP 409 Conflict (duplicate)
      if (
        error.response?.status === 409 &&
        typeof error.response.data?.message === 'string'
      ) {
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
      const response = await tenantApi.get(
        `/tenants/${tenantId}?expand=tenantUserRoles`,
      )

      return response.data.data.tenant
    } catch (error) {
      logApiError('Error getting tenant', error)

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
      const response = await tenantApi.get(
        `/users/${userId}/tenants?expand=tenantUserRoles`,
      )

      return response.data.data.tenants
    } catch (error) {
      logApiError('Error getting users tenants', error)

      throw error
    }
  },

  async getUsers(tenantId: string) {
    try {
      const response = await tenantApi.get(`/tenants/${tenantId}/users`)

      return response.data.data.users
    } catch (error) {
      logApiError('Error getting Tenant users', error)

      throw error
    }
  },

  async getTenantRoles(tenantId: string) {
    try {
      const response = await tenantApi.get(`/tenants/${tenantId}/roles`)

      return response.data.data.roles
    } catch (error) {
      logApiError('Error getting Tenant roles', error)

      throw error
    }
  },

  async getUserRoles(tenantId: string, userId: string) {
    try {
      const response = await tenantApi.get(
        `/tenants/${tenantId}/users/${userId}/roles`,
      )

      return response.data.data.roles
    } catch (error) {
      logApiError('Error getting Tenant users roles', error)

      throw error
    }
  },

  async addUsers(tenantId: string, user: User, role: Role): Promise<User> {
    try {
      const request: { user: any; roles?: string[] } = { user }
      request.roles = [role.id]

      // TODO: this is temporary until some decisions are made about how close
      // the mapping to the API should be.
      request.user.ssoUserId = user.id
      delete request.user.id
      delete request.user.roles

      const response = await tenantApi.post(
        `/tenants/${tenantId}/users`,
        request,
      )

      return response.data.data as User
    } catch (error) {
      logApiError('Error adding user to Tenant', error)

      throw error
    }
  },

  async assignUserRoles(
    tenantId: string,
    userId: string,
    roleId: string,
  ): Promise<void> {
    try {
      await tenantApi.put(
        `/tenants/${tenantId}/users/${userId}/roles/${roleId}`,
      )
    } catch (error) {
      logApiError('Error assigning user role in Tenant', error)

      throw error
    }
  },
}
