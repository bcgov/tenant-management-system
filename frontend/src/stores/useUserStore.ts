import { defineStore } from 'pinia'
import { ref } from 'vue'

import { userMapper, type UserSearchApiData } from '@/mappers/user.mapper'
import { User } from '@/models/user.model'
import { userService } from '@/services/user.service'
import {
  type BCeIDSearchType,
  type IdirSearchType,
  BCEID_SEARCH_TYPE,
  IDIR_SEARCH_TYPE,
} from '@/utils/constants'

/**
 * Pinia store for searching and managing IDIR users.
 */
export const useUserStore = defineStore('user', () => {
  const loading = ref(false)
  const searchResults = ref<User[]>([])

  /**
   * Private function to handle BCEID user search with loading state management.
   *
   * @param searchType - The type of search (email, firstName,
   *   lastName).
   * @param searchValue - The search value to pass to the service.
   * @returns A promise that resolves to an array of user data.
   * @throws {Error} If the search type is invalid.
   */
  const _searchBceidUsers = async (
    searchType: BCeIDSearchType,
    searchValue: string,
  ) => {
    loading.value = true
    try {
      let userSearchData: UserSearchApiData[] = []
      switch (searchType) {
        case BCEID_SEARCH_TYPE.EMAIL.value:
          userSearchData = await userService.searchBCeIDEmail(searchValue)
          break
        case BCEID_SEARCH_TYPE.DISPLAY_NAME.value:
          userSearchData = await userService.searchBCeIDDisplayName(searchValue)
          break
      }

      searchResults.value = userSearchData.map(userMapper.fromSearchData)

      return searchResults.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Private function to handle IDIR user search with loading state management.
   *
   * @param searchType - The type of search (email, firstName, lastName).
   * @param searchValue - The search value to pass to the service.
   * @returns A promise that resolves to an array of User objects.
   * @throws {Error} If the search type is invalid.
   */
  const _searchIdirUsers = async (
    searchType: IdirSearchType,
    searchValue: string,
  ): Promise<User[]> => {
    loading.value = true
    try {
      let userSearchData: UserSearchApiData[] = []
      switch (searchType) {
        case IDIR_SEARCH_TYPE.EMAIL.value:
          userSearchData = await userService.searchIdirEmail(searchValue)
          break
        case IDIR_SEARCH_TYPE.FIRST_NAME.value:
          userSearchData = await userService.searchIdirFirstName(searchValue)
          break
        case IDIR_SEARCH_TYPE.LAST_NAME.value:
          userSearchData = await userService.searchIdirLastName(searchValue)
          break
      }

      searchResults.value = userSearchData.map(userMapper.fromSearchData)

      return searchResults.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Searches for BCeID users based on the display name.
   *
   * @param displayName - The display name substring to search.
   * @returns A promise that resolves to an array of user data.
   */
  const searchBCeIDDisplayName = async (displayName: string) => {
    return _searchBceidUsers(BCEID_SEARCH_TYPE.DISPLAY_NAME.value, displayName)
  }

  /**
   * Searches for BCeID users based on the email address.
   *
   * @param email - The email address substring to search.
   * @returns A promise that resolves to an array of user data.
   */
  const searchBCeIDEmail = async (email: string) => {
    return _searchBceidUsers(BCEID_SEARCH_TYPE.EMAIL.value, email)
  }

  /**
   * Searches for IDIR users based on the email address.
   *
   * @param email - The email address substring to search.
   * @returns A promise that resolves to an array of user data.
   */
  const searchIdirEmail = async (email: string) => {
    return _searchIdirUsers(IDIR_SEARCH_TYPE.EMAIL.value, email)
  }

  /**
   * Searches for IDIR users based on the first name.
   *
   * @param firstName - The first name substring to search.
   * @returns A promise that resolves to an array of user data.
   */
  const searchIdirFirstName = async (firstName: string) => {
    return _searchIdirUsers(IDIR_SEARCH_TYPE.FIRST_NAME.value, firstName)
  }

  /**
   * Searches for IDIR users based on the last name.
   *
   * @param lastName - The last name substring to search.
   * @returns A promise that resolves to an array of user data.
   */
  const searchIdirLastName = async (lastName: string) => {
    return _searchIdirUsers(IDIR_SEARCH_TYPE.LAST_NAME.value, lastName)
  }

  return {
    loading,
    searchResults,

    searchBCeIDDisplayName,
    searchBCeIDEmail,
    searchIdirEmail,
    searchIdirFirstName,
    searchIdirLastName,
  }
})
