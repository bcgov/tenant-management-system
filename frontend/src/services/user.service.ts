import { authenticatedAxios } from './authenticated.axios'
import { logApiError } from './utils'
import type { IdirSearchParameters } from '@/types/IdirSearchParameters'

const api = authenticatedAxios()

export const userService = {
  /**
   * Searches for IDIR users based on the provided parameters.
   * @param {IdirSearchParameters} params - The search parameters.
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   user-like objects.
   */
  async searchIdirUsers(params: IdirSearchParameters) {
    try {
      const response = await api.get('/users/bcgovssousers/idir/search', {
        params,
      })

      return response.data.data
    } catch (error) {
      logApiError('Error searching IDIR users:', error)

      throw error
    }
  },
}
