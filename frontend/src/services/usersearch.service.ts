import { type UserSearchApiData } from '@/mappers/user.mapper'
import { authenticatedAxios } from '@/services/authenticated.axios'
import { logApiError } from '@/services/utils'
import { type BCeIDSearchType, type IdirSearchType } from '@/utils/constants'

const api = authenticatedAxios()

export const userSearchService = {
  /**
   * Search BCeID business users with different search parameters. Both first
   * and last name searches are supported, but they only search against the
   * display name.
   *
   * @param searchType - The type of search (email, displayName).
   * @param searchValue - The search value.
   */
  async searchBceidUsers(
    searchType: BCeIDSearchType,
    searchValue: string,
  ): Promise<UserSearchApiData[]> {
    try {
      const response = await api.get('/users/bcgovssousers/bceid/search', {
        params: { [searchType]: searchValue, bceidType: 'business' },
      })

      return response.data.data
    } catch (error) {
      logApiError('Error searching BCeID users', error)

      throw error
    }
  },

  /**
   * Searches for IDIR users with different search parameters.
   *
   * @param searchType - The type of search (email, firstName, lastName).
   * @param searchValue - The search value.
   */
  async searchIdirUsers(
    searchType: IdirSearchType,
    searchValue: string,
  ): Promise<UserSearchApiData[]> {
    try {
      const response = await api.get('/users/bcgovssousers/idir/search', {
        params: { [searchType]: searchValue },
      })

      return response.data.data
    } catch (error) {
      logApiError('Error searching IDIR users', error)

      throw error
    }
  },
}
