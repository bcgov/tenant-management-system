import axios from 'axios'

import { authenticatedAxios } from '@/services/authenticated.axios'
import { config } from '@/services/config.service'
import { logger } from '@/utils/logger'

/**
 * Axios instance configured for tenant API requests.
 *
 */
const roleApi = authenticatedAxios()
roleApi.defaults.baseURL = config.api.baseUrl

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

export const roleService = {
  /**
   * Retrieves all the roles.
   *
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *     role-like objects.
   * @throws Will throw an error if the API request fails.
   */
  async getRoles() {
    try {
      const response = await roleApi.get('/roles')

      return response.data.data.roles
    } catch (error) {
      logApiError('Error getting roles', error)

      throw error
    }
  },
}
