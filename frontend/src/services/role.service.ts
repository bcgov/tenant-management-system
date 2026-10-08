import {
  type RoleApiData,
  type RoleListApiEnvelope,
} from '@/mappers/role.mapper'
import { authenticatedFetch } from '@/services/api'
import { logApiError } from '@/services/utils'

const api = authenticatedFetch()

export const roleService = {
  /**
   * Retrieves all the roles.
   *
   * @throws Will throw an error if the API request fails.
   */
  async getRoles(): Promise<RoleApiData[]> {
    try {
      const response = await api.get<RoleListApiEnvelope>('/roles')

      return response.data.data.roles
    } catch (error) {
      logApiError('Error getting roles', error)

      throw error
    }
  },
}
