import { type RoleApiData } from '@/models/role.model'
import { authenticatedAxios } from '@/services/authenticated.axios'
import { logApiError } from '@/services/utils'

const api = authenticatedAxios()

export const roleService = {
  /**
   * Retrieves all the roles.
   *
   * @returns A promise that resolves to an array of role data.
   * @throws Will throw an error if the API request fails.
   */
  async getRoles(): Promise<RoleApiData[]> {
    try {
      const response = await api.get('/roles')

      return response.data.data.roles
    } catch (error) {
      logApiError('Error getting roles', error)

      throw error
    }
  },
}
