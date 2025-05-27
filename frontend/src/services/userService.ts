import axios, { AxiosError } from 'axios'

import { useNotification } from '@/composables/useNotification'
import type { Tenant } from '@/models/tenant.model'
import type { User } from '@/models/user.model'
import { useAuthStore } from '@/stores/useAuthStore'
import type { IdirSearchParameters } from '@/types/IdirSearchParameters'
import { logger } from '@/utils/logger'

// Create an instance of axios for user service
const userService = axios.create({
  baseURL:
    import.meta.env.VITE_BACKEND_API_URL || process.env.VITE_BACKEND_API_URL,
})

// User notification creation
const { addNotification } = useNotification()

/**
 * Gets the tenants of the current user.
 * @returns {Array} The list of tenants.
 */
export const getUserTenants = async (): Promise<Tenant[]> => {
  const user = useAuthStore().user

  if (user?.id) {
    try {
      const response = await userService.get(`/users/${user.id}/tenants`)

      return response.data
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        logger.error('Error fetching user tenants:', error.response.data)
      } else {
        logger.error('Error fetching user tenants:', error)
      }

      addNotification('Error fetching user tenants', 'error')

      throw error
    }
  } else {
    const error = new Error('User ID is not available')
    logger.error(error.message)
    addNotification('User ID is not available', 'error')

    throw error
  }
}

/**
 * Searches for IDIR users based on the provided parameters.
 * @param {Object} params - The search parameters.
 * @returns {Array} The list of matching IDIR users.
 */
export const searchIdirUsers = async (
  params: IdirSearchParameters,
): Promise<User[]> => {
  try {
    const response = await userService.get(`/users/bcgovssousers/idir/search`, {
      params,
    })

    return response.data.data
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      logger.error('Error getting IDIR users:', error.response.data)
    } else {
      logger.error('Error getting IDIR users:', error)
    }
    addNotification('Error getting IDIR users', 'error')

    throw error
  }
}
