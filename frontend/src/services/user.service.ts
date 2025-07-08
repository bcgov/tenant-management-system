import { authenticatedAxios } from './authenticated.axios'
import { logApiError } from './utils'
import { type IdirSearchType, IDIR_SEARCH_TYPE } from '@/utils/constants'

const api = authenticatedAxios()

export const userService = {
  /**
   * Private function to search for IDIR users with different search parameters.
   * @param {IdirSearchType} searchType - The type of search (email, firstName,
   *   lastName).
   * @param {string} searchValue - The search value.
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   user-like objects.
   */
  async _searchIdirUsers(searchType: IdirSearchType, searchValue: string) {
    try {
      const response = await api.get('/users/bcgovssousers/idir/search', {
        params: { [searchType]: searchValue },
      })

      return response.data.data
    } catch (error) {
      logApiError('Error searching IDIR users:', error)
      throw error
    }
  },

  /**
   * Searches for IDIR users based on the email address.
   * @param {string} email - The email address substring to search.
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   user-like objects.
   */
  async searchIdirEmail(email: string) {
    return this._searchIdirUsers(IDIR_SEARCH_TYPE.EMAIL.value, email)
  },

  /**
   * Searches for IDIR users based on the first name.
   * @param {string} firstName - The first name substring to search.
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   user-like objects.
   */
  async searchIdirFirstName(firstName: string) {
    return this._searchIdirUsers(IDIR_SEARCH_TYPE.FIRST_NAME.value, firstName)
  },

  /**
   * Searches for IDIR users based on the last name.
   * @param {string} lastName - The last name substring to search.
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   user-like objects.
   */
  async searchIdirLastName(lastName: string) {
    return this._searchIdirUsers(IDIR_SEARCH_TYPE.LAST_NAME.value, lastName)
  },
}
