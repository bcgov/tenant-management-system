import { defineStore } from 'pinia'
import { ref } from 'vue'

import { userMapper } from '@/mappers/user.mapper'
import { User } from '@/models/user.model'
import { userSearchService } from '@/services/usersearch.service'
import {
  type BCeIDSearchType,
  type IdirSearchType,
  IDIR_TO_BCEID_SEARCH_TYPE,
} from '@/utils/constants'

/**
 * Pinia store for searching BCeID and IDIR users.
 */
export const useUserSearchStore = defineStore('userSearch', () => {
  const searchResults = ref<User[]>([])

  const _searchBceidUsers = async (
    searchType: BCeIDSearchType,
    searchValue: string,
  ) => {
    const data = await userSearchService.searchBceidUsers(
      searchType,
      searchValue,
    )

    return data.map(userMapper.fromSearchData)
  }

  const _searchIdirUsers = async (
    searchType: IdirSearchType,
    searchValue: string,
  ) => {
    const data = await userSearchService.searchIdirUsers(
      searchType,
      searchValue,
    )

    return data.map(userMapper.fromSearchData)
  }

  /**
   * Searches IDIR and the matching BCeID field in parallel and combines the
   * results.
   *
   * @throws if either search fails.
   */
  const searchUsers = async (
    searchType: IdirSearchType,
    searchText: string,
  ) => {
    const bceidSearchType = IDIR_TO_BCEID_SEARCH_TYPE[searchType]

    const [bceidResults, idirResults] = await Promise.all([
      _searchBceidUsers(bceidSearchType, searchText),
      _searchIdirUsers(searchType, searchText),
    ])

    searchResults.value = bceidResults.concat(idirResults)

    return searchResults.value
  }

  return {
    searchResults,

    searchUsers,
  }
})
