import { type UserSearchApiData } from '@/models/user.model'
import { authenticatedAxios } from '@/services/authenticated.axios'
import { logApiError } from '@/services/utils'
import {
  type IdirSearchType,
  IDIR_SEARCH_TYPE,
  type BCeIDSearchType,
  BCeID_SEARCH_TYPE,
} from '@/utils/constants'

const api = authenticatedAxios()

export const userService = {
  /**
   * Private function to search for IDIR users with different search parameters.
   * @param searchType - The type of search (email, firstName, lastName).
   * @param searchValue - The search value.
   * @returns A promise that resolves to an array of user data.
   */
  async _searchIdirUsers(
    searchType: IdirSearchType,
    searchValue: string,
  ): Promise<UserSearchApiData[]> {
    try {
      const response = await api.get('/users/bcgovssousers/idir/search', {
        params: {
          [searchType]: searchValue,
        },
      })

      return response.data.data
    } catch (error) {
      logApiError('Error searching IDIR users:', error)

      throw error
    }
  },

  /**
   * Private function to search for IDIR users with different search parameters.
   * @param searchType - The type of search (email, firstName, lastName).
   * @param searchValue - The search value.
   * @returns A promise that resolves to an array of user data.
   */
  async _searchBceidUsers(
    searchType: BCeIDSearchType,
    searchValue: string,
  ): Promise<UserSearchApiData[]> {
    try {
      const response = await api.get('/users/bcgovssousers/bceid/search', {
        params: {
          [searchType]: searchValue,
          bceidType: 'both',
        },
      })

      return response.data.data
    } catch (error) {
      logApiError('Error searching BCeID users:', error)

      throw error
    }
  },

  /**
   * Searches for IDIR users based on the email address.
   * @param email - The email address substring to search.
   * @returns A promise that resolves to an array of user data.
   */
  async searchIdirEmail(email: string): Promise<UserSearchApiData[]> {
    return this._searchIdirUsers(IDIR_SEARCH_TYPE.EMAIL.value, email)
  },

  /**
   * Searches for IDIR users based on the first name.
   * @param firstName - The first name substring to search.
   * @returns A promise that resolves to an array of user data.
   */
  async searchIdirFirstName(firstName: string): Promise<UserSearchApiData[]> {
    return this._searchIdirUsers(IDIR_SEARCH_TYPE.FIRST_NAME.value, firstName)
  },

  /**
   * Searches for IDIR users based on the last name.
   * @param lastName - The last name substring to search.
   * @returns A promise that resolves to an array of user data.
   */
  async searchIdirLastName(lastName: string): Promise<UserSearchApiData[]> {
    return this._searchIdirUsers(IDIR_SEARCH_TYPE.LAST_NAME.value, lastName)
  },

  /**
   * Searches for BCeID users based on the first name.
   * @param firstName - The first name substring to search.
   * @returns A promise that resolves to an array of user data.
   */
  async searchBCeIDDisplayName(
    firstName: string,
  ): Promise<UserSearchApiData[]> {
    return this._searchBceidUsers(
      BCeID_SEARCH_TYPE.DISPLAY_NAME.value,
      firstName,
    )
  },

  /**
   * Searches for BCeID users based on the email.
   * @param email - The email substring to search.
   * @returns A promise that resolves to an array of user data.
   */
  async searchBCeIDEmail(email: string): Promise<UserSearchApiData[]> {
    return this._searchBceidUsers(BCeID_SEARCH_TYPE.EMAIL.value, email)
  },
}
