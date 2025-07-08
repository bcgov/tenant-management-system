import { defineStore } from 'pinia'
import { ref } from 'vue'

import { User } from '@/models'
import { userService } from '@/services'
import { type IdirSearchType, IDIR_SEARCH_TYPE } from '@/utils/constants'

export const useUserStore = defineStore('user', () => {
  const loading = ref(false)
  const searchResults = ref<User[]>([])

  /**
   * Private function to handle IDIR user search with loading state management.
   *
   * @param {IdirSearchType} searchType - The type of search (email, firstName,
   *   lastName).
   * @param {string} searchValue - The search value to pass to the service.
   * @returns {Promise<User[]>} A promise that resolves to an array of User
   *   objects.
   */
  async function _searchIdirUsers(
    searchType: IdirSearchType,
    searchValue: string,
  ) {
    loading.value = true
    try {
      let response
      switch (searchType) {
        case IDIR_SEARCH_TYPE.EMAIL.value:
          response = await userService.searchIdirEmail(searchValue)
          break
        case IDIR_SEARCH_TYPE.FIRST_NAME.value:
          response = await userService.searchIdirFirstName(searchValue)
          break
        case IDIR_SEARCH_TYPE.LAST_NAME.value:
          response = await userService.searchIdirLastName(searchValue)
          break
        default:
          throw new Error(`Invalid search type: ${searchType}`)
      }

      searchResults.value = response.map(User.fromSearchData)

      return searchResults.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Searches for IDIR users based on the email address.
   *
   * @param {string} email - The email address substring to search.
   * @returns {Promise<User[]>} A promise that resolves to an array of User
   *   objects.
   */
  async function searchIdirEmail(email: string) {
    return _searchIdirUsers(IDIR_SEARCH_TYPE.EMAIL.value, email)
  }

  /**
   * Searches for IDIR users based on the first name.
   *
   * @param {string} firstName - The first name substring to search.
   * @returns {Promise<User[]>} A promise that resolves to an array of User
   *   objects.
   */
  async function searchIdirFirstName(firstName: string) {
    return _searchIdirUsers(IDIR_SEARCH_TYPE.FIRST_NAME.value, firstName)
  }

  /**
   * Searches for IDIR users based on the last name.
   *
   * @param {string} lastName - The last name substring to search.
   * @returns {Promise<User[]>} A promise that resolves to an array of User
   *   objects.
   */
  async function searchIdirLastName(lastName: string) {
    return _searchIdirUsers(IDIR_SEARCH_TYPE.LAST_NAME.value, lastName)
  }

  return {
    loading,
    searchResults,

    searchIdirEmail,
    searchIdirFirstName,
    searchIdirLastName,
  }
})
