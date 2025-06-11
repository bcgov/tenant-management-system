import { authenticatedAxios } from './authenticated.axios'
import { logApiError } from './utils'

const api = authenticatedAxios()

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
      const response = await api.get('/roles')

      return response.data.data.roles
    } catch (error) {
      logApiError('Error getting roles', error)

      throw error
    }
  },
}
