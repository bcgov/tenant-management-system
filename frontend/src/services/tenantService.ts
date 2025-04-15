import axios, { AxiosError } from 'axios'
import { logError } from '@/plugins/console'
import notificationService from '@/services/notification'
import type { Tenancy } from '@/types/Tenancy'
import type { User } from '@/types/User'

// Create an instance of axios for tenant service
const tenantService = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || process.env.VITE_BACKEND_API_URL,
})

/**
 * Creates a new tenancy.
 * @param {Object} tenancy - The tenancy data to be created.
 * @returns {Object} The created tenancy data.
 */
export const createTenancy = async (tenancy: Tenancy) => {
  try {
    const response = await tenantService.post(`/tenants`, tenancy)
    return response.data.data.tenant
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      logError('Error creating tenancy:', error.response.data)
    } else {
      logError('Error creating tenancy:', error)
    }
    notificationService.addNotification('Error creating tenancy', 'error')
    throw error
  }
}

/**
 * Gets the tenancies of a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Array} The list of tenancies.
 */
export const getUserTenants = async (userId: string) => {
  try {
    const response = await tenantService.get(`/users/${userId}/tenants`)
    return response.data.data.users
  } catch (error) {
    const message = 'Error getting users tenancies'
    if (error instanceof AxiosError && error.response) {
      logError(message, error.response.data)
    } else {
      logError(message, error)
    }
    notificationService.addNotification(message, 'error')
    throw error
  }
}

/**
 * Gets the users of a specific tenancy.
 * @param {string} tenancyId - The ID of the tenancy.
 * @returns {Array} The list of users.
 */
export const getTenantUsers = async (tenancyId: string) => {
  try {
    const response = await tenantService.get(`/tenants/${tenancyId}/users`)
    return response.data.data.users
  } catch (error) {
    const message = 'Error getting tenancy users'
    if (error instanceof AxiosError && error.response) {
      logError(message, error.response.data)
    } else {
      logError(message, error)
    }
    notificationService.addNotification(message, 'error')
    throw error
  }
}

/**
 * Gets the roles of a specific tenancy.
 * @param {string} tenancyId - The ID of the tenancy.
 * @returns {Array} The list of roles.
 */
export const getTenantRoles = async (tenancyId: string) => {
  try {
    const response = await tenantService.get(`/tenants/${tenancyId}/roles`)
    return response.data.data.roles
  } catch (error) {
    const message = 'Error getting tenancy roles'
    if (error instanceof AxiosError && error.response) {
      logError(message, error.response.data)
    } else {
      logError(message, error)
    }
    notificationService.addNotification(message, 'error')
    throw error
  }
}

/**
 * Gets the roles of a specific user in a tenancy.
 * @param {string} tenancyId - The ID of the tenancy.
 * @param {string} userId - The ID of the user.
 * @returns {Array} The list of user roles.
 */
export const getTenantUserRoles = async (tenancyId: string, userId: string) => {
  try {
    const response = await tenantService.get(`/tenants/${tenancyId}/users/${userId}/roles`)
    return response.data.data.roles
  } catch (error) {
    const message = 'Error getting tenancy users roles'
    if (error instanceof AxiosError && error.response) {
      logError(message, error.response.data)
    } else {
      logError(message, error)
    }
    notificationService.addNotification('Error getting tenancy users roles', 'error')
    throw error
  }
}

/**
 * Adds a user to a specific tenancy.
 * @param {string} tenancyId - The ID of the tenancy.
 * @param {Object} user - The user data to be added.
 * @param {string|null} [roleId=null] - The ID of the role to be assigned (optional).
 * @returns {Object} The added user data.
 */
export const addTenantUsers = async (tenancyId: string, user: User, roleId?: string) => {
  try {
    let request: any = { user }
    if (roleId !== null) {
      request.role = { id: roleId }
    }
    const response = await tenantService.post(`/tenants/${tenancyId}/users`, request)
    return response.data.data
  } catch (error) {
    const message = 'Error adding user to tenancy'
    if (error instanceof AxiosError && error.response) {
      logError(message, error.response.data)
    } else {
      logError(message, error)
    }
    notificationService.addNotification(message, 'error')
    throw error
  }
}

/**
 * Assigns a role to a specific user in a tenancy.
 * @param {string} tenancyId - The ID of the tenancy.
 * @param {string} userId - The ID of the user.
 * @param {string} roleId - The ID of the role to be assigned.
 * @returns {Object} The response data.
 */
export const assignUserRoles = async (tenancyId: string, userId: string, roleId: string) => {
  try {
    const response = await tenantService.put(
      `/tenants/${tenancyId}/users/${userId}/roles/${roleId}`,
    )
    return response.data
  } catch (error) {
    const message = 'Error assigning user role in tenancy'
    if (error instanceof AxiosError && error.response) {
      logError(message, error.response.data)
    } else {
      logError(message, error)
    }
    notificationService.addNotification(message, 'error')
    throw error
  }
}
