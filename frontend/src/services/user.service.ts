import type { Tenant } from '@/models/tenant.model'
import type { User } from '@/models/user.model'
import type { IdirSearchParameters } from '@/types/IdirSearchParameters'
import { authenticatedAxios } from '@/services/authenticated.axios'
import { config } from '@/services/config.service'
import { logger } from '@/utils/logger'

const userApi = authenticatedAxios()
userApi.defaults.baseURL = config.api.baseUrl

export const userService = {
  /**
   * Gets the tenants for a specific user.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Tenant[]>} A promise that resolves to an array of tenants.
   */
  async getUserTenants(userId: string): Promise<Tenant[]> {
    try {
      const response = await userApi.get(`/users/${userId}/tenants`)
      return response.data.data
    } catch (error) {
      logger.error('Error fetching user tenants:', error)
      throw error
    }
  },

  /**
   * Searches for IDIR users based on the provided parameters.
   * @param {IdirSearchParameters} params - The search parameters.
   * @returns {Promise<User[]>} A promise that resolves to an array of users.
   */
  async searchIdirUsers(params: IdirSearchParameters): Promise<User[]> {
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
