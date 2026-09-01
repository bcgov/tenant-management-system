import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type UserSearchApiData } from '@/mappers/user.mapper'
import { User } from '@/models/user.model'
import { userSearchService } from '@/services/usersearch.service'
import { useUserSearchStore } from '@/stores/useUserSearchStore'
import { BCEID_SEARCH_TYPE, IDIR_SEARCH_TYPE } from '@/utils/constants'

vi.mock('@/services/usersearch.service', () => ({
  userSearchService: {
    searchBceidUsers: vi.fn(),
    searchIdirUsers: vi.fn(),
  },
}))

describe('useUserSearchStore', () => {
  const mockSearchData: UserSearchApiData = {
    attributes: {
      idir_username: ['JDOE'],
      idir_user_guid: ['123-guid'],
    },
    email: 'john.doe@gov.bc.ca',
    firstName: 'John',
    lastName: 'Doe',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('searchUsers', () => {
    it.each([
      {
        idirSearchType: IDIR_SEARCH_TYPE.FIRST_NAME.value,
        bceidSearchType: BCEID_SEARCH_TYPE.DISPLAY_NAME.value,
      },
      {
        idirSearchType: IDIR_SEARCH_TYPE.LAST_NAME.value,
        bceidSearchType: BCEID_SEARCH_TYPE.DISPLAY_NAME.value,
      },
      {
        idirSearchType: IDIR_SEARCH_TYPE.EMAIL.value,
        bceidSearchType: BCEID_SEARCH_TYPE.EMAIL.value,
      },
    ])(
      'maps IDIR $idirSearchType to BCeID $bceidSearchType',
      async ({ idirSearchType, bceidSearchType }) => {
        const store = useUserSearchStore()
        vi.mocked(userSearchService.searchIdirUsers).mockResolvedValue([])
        vi.mocked(userSearchService.searchBceidUsers).mockResolvedValue([])

        await store.searchUsers(idirSearchType, 'search text')

        expect(userSearchService.searchIdirUsers).toHaveBeenCalledWith(
          idirSearchType,
          'search text',
        )
        expect(userSearchService.searchBceidUsers).toHaveBeenCalledWith(
          bceidSearchType,
          'search text',
        )
      },
    )

    it('combines and maps IDIR and BCeID results into searchResults', async () => {
      const store = useUserSearchStore()
      const idirData = { ...mockSearchData, email: 'idir@gov.bc.ca' }
      const bceidData = { ...mockSearchData, email: 'bceid@example.com' }
      vi.mocked(userSearchService.searchIdirUsers).mockResolvedValue([idirData])
      vi.mocked(userSearchService.searchBceidUsers).mockResolvedValue([
        bceidData,
      ])

      const result = await store.searchUsers(
        IDIR_SEARCH_TYPE.EMAIL.value,
        'search text',
      )

      expect(result).toHaveLength(2)
      expect(result.every((user) => user instanceof User)).toBe(true)
      expect(store.searchResults).toEqual(result)
      expect(store.searchResults.map((u) => u.ssoUser.email)).toEqual(
        expect.arrayContaining(['bceid@example.com', 'idir@gov.bc.ca']),
      )
    })

    it('propagates an error if the IDIR search fails', async () => {
      const store = useUserSearchStore()
      const error = new Error('IDIR search failed')
      vi.mocked(userSearchService.searchIdirUsers).mockRejectedValue(error)
      vi.mocked(userSearchService.searchBceidUsers).mockResolvedValue([])

      const promise = store.searchUsers(
        IDIR_SEARCH_TYPE.EMAIL.value,
        'search text',
      )

      await expect(promise).rejects.toThrow(error)
    })

    it('propagates an error if the BCeID search fails', async () => {
      const store = useUserSearchStore()
      const error = new Error('BCeID search failed')
      vi.mocked(userSearchService.searchIdirUsers).mockResolvedValue([])
      vi.mocked(userSearchService.searchBceidUsers).mockRejectedValue(error)

      const promise = store.searchUsers(
        IDIR_SEARCH_TYPE.EMAIL.value,
        'search text',
      )

      await expect(promise).rejects.toThrow(error)
    })
  })
})
