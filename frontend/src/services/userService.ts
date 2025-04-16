import axios, { AxiosError } from 'axios'
import { logError } from '@/plugins/console'
import { getUser } from '@/services/keycloak'
import notificationService from '@/services/notification'
import type { IdirSearchParameters } from '@/types/IdirSearchParameters'
import type { Tenant } from '@/models/Tenant'
import type { User } from '@/types/User'

// Create an instance of axios for user service
const userService = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || process.env.VITE_BACKEND_API_URL,
})

/**
 * Gets the tenants of the current user.
 * @returns {Array} The list of tenants.
 */
export const getUserTenants = async (): Promise<Tenant[]> => {
  const user = getUser()
  if (user && user.ssoUserId) {
    try {
      const response = await userService.get(`/users/${user.ssoUserId}/tenants`)
      return response.data
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        logError('Error fetching user tenants:', error.response.data)
      } else {
        logError('Error fetching user tenants:', error)
      }
      notificationService.addNotification('Error fetching user tenants', 'error')
      throw error
    }
  } else {
    const error = new Error('User ID is not available')
    logError(error.message)
    notificationService.addNotification('User ID is not available', 'error')
    throw error
  }
}

/**
 * Searches for IDIR users based on the provided parameters.
 * @param {Object} params - The search parameters.
 * @returns {Array} The list of matching IDIR users.
 */
export const searchIdirUsers = async (params: IdirSearchParameters): Promise<User[]> => {
  try {
    const response = await userService.get(`/users/bcgovssousers/idir/search`, {
      params,
    })
    return response.data.data
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      logError('Error getting IDIR users:', error.response.data)
    } else {
      logError('Error getting IDIR users:', error)
    }
    notificationService.addNotification('Error getting IDIR users', 'error')
    throw error
  }
}
