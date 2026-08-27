import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeUserSearchApiData } from '@/__tests__/__factories__'

import * as utils from '@/services/utils'
import { BCEID_SEARCH_TYPE, IDIR_SEARCH_TYPE } from '@/utils/constants'

vi.mock('@/services/utils', () => ({
  logApiError: vi.fn(),
}))

const mockedUtils = vi.mocked(utils)

mockedUtils.logApiError.mockImplementation(() => {})

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}))

vi.mock('@/services/authenticated.axios', () => ({
  authenticatedAxios: () => ({
    get: mockGet,
  }),
}))

import { userSearchService } from '@/services/usersearch.service'

describe('userSearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('searchBceidUsers', () => {
    it.each([
      {
        searchType: BCEID_SEARCH_TYPE.DISPLAY_NAME.value,
        searchValue: 'searchDisplayName',
      },
      { searchType: BCEID_SEARCH_TYPE.EMAIL.value, searchValue: 'searchEmail' },
    ])(
      'calls the api with $searchType',
      async ({ searchType, searchValue }) => {
        mockGet.mockResolvedValueOnce({ data: {} })

        await userSearchService.searchBceidUsers(searchType, searchValue)

        expect(mockGet).toHaveBeenCalledWith(
          '/users/bcgovssousers/bceid/search',
          {
            params: { [searchType]: searchValue, bceidType: 'business' },
          },
        )
      },
    )

    it('returns mapped data on success', async () => {
      const userApiData = makeUserSearchApiData({
        attributes: { attributeKey: ['attributeValue'] },
        email: 'userEmail',
        firstName: 'userFirstName',
        lastName: 'userLastName',
      })
      mockGet.mockResolvedValueOnce({ data: { data: [userApiData] } })

      const result = await userSearchService.searchBceidUsers(
        BCEID_SEARCH_TYPE.EMAIL.value,
        'searchEmail',
      )

      expect(result).toHaveLength(1)
      expect(result[0].attributes.attributeKey).toHaveLength(1)
      expect(result[0].attributes?.attributeKey?.at(0)).toBe('attributeValue')
      expect(result[0].email).toBe('userEmail')
      expect(result[0].firstName).toBe('userFirstName')
      expect(result[0].lastName).toBe('userLastName')
    })

    it('returns empty array for no matches', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userSearchService.searchBceidUsers(
        BCEID_SEARCH_TYPE.EMAIL.value,
        'searchEmail',
      )

      expect(result).toEqual([])
    })

    it('logs and propagates errors', async () => {
      const error = new Error('message')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        userSearchService.searchBceidUsers(
          BCEID_SEARCH_TYPE.EMAIL.value,
          'searchEmail',
        ),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error searching BCeID users',
        error,
      )
    })
  })

  describe('searchIdirUsers', () => {
    it.each([
      { searchType: IDIR_SEARCH_TYPE.EMAIL.value, searchValue: 'searchEmail' },
      {
        searchType: IDIR_SEARCH_TYPE.FIRST_NAME.value,
        searchValue: 'searchFirstName',
      },
      {
        searchType: IDIR_SEARCH_TYPE.LAST_NAME.value,
        searchValue: 'searchLastName',
      },
    ])(
      'calls the api with $searchType',
      async ({ searchType, searchValue }) => {
        mockGet.mockResolvedValueOnce({ data: {} })

        await userSearchService.searchIdirUsers(searchType, searchValue)

        expect(mockGet).toHaveBeenCalledWith(
          '/users/bcgovssousers/idir/search',
          {
            params: { [searchType]: searchValue },
          },
        )
      },
    )

    it('returns mapped data on success', async () => {
      const userApiData = makeUserSearchApiData({
        attributes: { attributeKey: ['attributeValue'] },
        email: 'userEmail',
        firstName: 'userFirstName',
        lastName: 'userLastName',
      })
      mockGet.mockResolvedValueOnce({ data: { data: [userApiData] } })

      const result = await userSearchService.searchIdirUsers(
        IDIR_SEARCH_TYPE.EMAIL.value,
        'searchEmail',
      )

      expect(result).toHaveLength(1)
      expect(result[0].attributes.attributeKey).toHaveLength(1)
      expect(result[0].attributes?.attributeKey?.at(0)).toBe('attributeValue')
      expect(result[0].email).toBe('userEmail')
      expect(result[0].firstName).toBe('userFirstName')
      expect(result[0].lastName).toBe('userLastName')
    })

    it('returns empty array for no matches', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userSearchService.searchIdirUsers(
        IDIR_SEARCH_TYPE.EMAIL.value,
        'searchEmail',
      )

      expect(result).toEqual([])
    })

    it('logs and propagates errors', async () => {
      const error = new Error('message')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        userSearchService.searchIdirUsers(
          IDIR_SEARCH_TYPE.EMAIL.value,
          'searchEmail',
        ),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error searching IDIR users',
        error,
      )
    })
  })
})
