import { authenticatedAxios } from '@/services/authenticated.axios'
import { config } from '@/services/config.service'
import type { IdirSearchParameters } from '@/types/IdirSearchParameters'
import { logger } from '@/utils/logger'

const userApi = authenticatedAxios()
userApi.defaults.baseURL = config.api.baseUrl

export const userService = {
  /**
   * Searches for IDIR users based on the provided parameters.
   * @param {IdirSearchParameters} params - The search parameters.
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   user-like objects.
   */
  async searchIdirUsers(params: IdirSearchParameters) {
    try {
      const response = await userApi.get('/users/bcgovssousers/idir/search', {
        params,
      })

      return response.data.data
    } catch (error) {
      logger.error('Error searching IDIR users:', error)

      throw error
    }
  },
}
