import axios from 'axios'

import { DuplicateEntityError, ValidationError } from '@/errors'
import { logger } from '@/utils/logger'
import { User } from '@/models/user.model'
import { authenticatedAxios } from '@/services/authenticated.axios'

/**
 * Axios instance configured for tenant API requests.
 *
 * The base URL is determined from environment variables, supporting both
 * Vite's import.meta.env and Node's process.env.
 */
const tenantApi = authenticatedAxios()
tenantApi.defaults.baseURL =
  import.meta.env.VITE_BACKEND_API_URL ?? process.env.VITE_BACKEND_API_URL

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
export const createTenant = async (
  name: string,
  ministryName: string,
  user: User,
) => {
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
}
/**
 * Retrieves the tenants associated with the specified user.
 *
 * @param {string} userId - The SSO user ID of the user.
 * @returns {Promise<object[]>} A promise that resolves to an array of
 *   tenant-like objects.
 * @throws Will throw an error if the API request fails.
 */
export const getUserTenants = async (userId: string) => {
  try {
    const response = await tenantApi.get(`/users/${userId}/tenants`)

    return response.data.data.tenants
  } catch (error) {
    logApiError('Error getting users tenants', error)

    throw error
  }
}

export const getUsers = async (tenantId: string) => {
  try {
    const response = await tenantApi.get(`/tenants/${tenantId}/users`)

    return response.data.data.users
  } catch (error) {
    logApiError('Error getting Tenant users', error)

    throw error
  }
}

export const getTenantRoles = async (tenantId: string) => {
  try {
    const response = await tenantApi.get(`/tenants/${tenantId}/roles`)

    return response.data.data.roles
  } catch (error) {
    logApiError('Error getting Tenant roles', error)

    throw error
  }
}

export const getUserRoles = async (tenantId: string, userId: string) => {
  try {
    const response = await tenantApi.get(
      `/tenants/${tenantId}/users/${userId}/roles`,
    )

    return response.data.data.roles
  } catch (error) {
    logApiError('Error getting Tenant users roles', error)

    throw error
  }
}

export const addUsers = async (
  tenantId: string,
  user: User,
  roleId?: string,
): Promise<User> => {
  try {
    const request: { user: User; role?: { id: string } } = { user }
    if (roleId) {
      request.role = { id: roleId }
    }
    const response = await tenantApi.post(`/tenants/${tenantId}/users`, request)

    return response.data.data as User
  } catch (error) {
    logApiError('Error adding user to Tenant', error)

    throw error
  }
}

export const assignUserRoles = async (
  tenantId: string,
  userId: string,
  roleId: string,
): Promise<void> => {
  try {
    await tenantApi.put(`/tenants/${tenantId}/users/${userId}/roles/${roleId}`)
  } catch (error) {
    logApiError('Error assigning user role in Tenant', error)

    throw error
  }
}
