import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as utils from '@/services/utils'

vi.mock('@/services/utils', () => ({
  logApiError: vi.fn(),
}))

const mockedUtils = vi.mocked(utils)

mockedUtils.logApiError.mockImplementation(() => {})

// Create mock functions in vi.hoisted to ensure they're available during module loading
const { mockGet, mockPost, mockPut, mockDelete, mockPatch } = vi.hoisted(
  () => ({
    mockGet: vi.fn(),
    mockPost: vi.fn(),
    mockPut: vi.fn(),
    mockDelete: vi.fn(),
    mockPatch: vi.fn(),
  }),
)

// Mock the authenticated axios to return an object with HTTP methods
vi.mock('@/services/authenticated.axios', () => ({
  authenticatedAxios: () => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
    patch: mockPatch,
  }),
}))

// Mock the constants
vi.mock('@/utils/constants', () => ({
  IDIR_SEARCH_TYPE: {
    EMAIL: { value: 'email' },
    FIRST_NAME: { value: 'firstName' },
    LAST_NAME: { value: 'lastName' },
  },
}))

import { userService } from '@/services/user.service'

describe('userService', () => {
  const fakeIdirUsers = [
    {
      ssoUserId: '123',
      email: 'john.doe@gov.bc.ca',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'Doe, John',
      userName: 'JDOE',
    },
    {
      ssoUserId: '124',
      email: 'jane.smith@gov.bc.ca',
      firstName: 'Jane',
      lastName: 'Smith',
      displayName: 'Smith, Jane',
      userName: 'JSMITH',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('_searchIdirUsers', () => {
    it('should return IDIR users for email search', async () => {
      const searchValue = 'john.doe@gov.bc.ca'
      mockGet.mockResolvedValueOnce({ data: { data: fakeIdirUsers } })

      const result = await userService._searchIdirUsers('email', searchValue)

      expect(result).toEqual(fakeIdirUsers)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { email: searchValue },
      })
    })

    it('should return IDIR users for firstName search', async () => {
      const searchValue = 'John'
      mockGet.mockResolvedValueOnce({ data: { data: fakeIdirUsers } })

      const result = await userService._searchIdirUsers(
        'firstName',
        searchValue,
      )

      expect(result).toEqual(fakeIdirUsers)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { firstName: searchValue },
      })
    })

    it('should return IDIR users for lastName search', async () => {
      const searchValue = 'Doe'
      mockGet.mockResolvedValueOnce({ data: { data: fakeIdirUsers } })

      const result = await userService._searchIdirUsers('lastName', searchValue)

      expect(result).toEqual(fakeIdirUsers)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { lastName: searchValue },
      })
    })

    it('should return empty array when no users found', async () => {
      const searchValue = 'nonexistent@gov.bc.ca'
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userService._searchIdirUsers('email', searchValue)

      expect(result).toEqual([])
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { email: searchValue },
      })
    })

    it('should log and rethrow errors', async () => {
      const searchValue = 'test@gov.bc.ca'
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        userService._searchIdirUsers('email', searchValue),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error searching IDIR users:',
        error,
      )
    })
  })

  describe('searchIdirEmail', () => {
    it('should search IDIR users by email', async () => {
      const email = 'john.doe@gov.bc.ca'
      const filteredUsers = [fakeIdirUsers[0]]
      mockGet.mockResolvedValueOnce({ data: { data: filteredUsers } })

      const result = await userService.searchIdirEmail(email)

      expect(result).toEqual(filteredUsers)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { email },
      })
    })

    it('should handle partial email searches', async () => {
      const partialEmail = 'john'
      mockGet.mockResolvedValueOnce({ data: { data: fakeIdirUsers } })

      const result = await userService.searchIdirEmail(partialEmail)

      expect(result).toEqual(fakeIdirUsers)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { email: partialEmail },
      })
    })

    it('should return empty array for no matches', async () => {
      const email = 'nonexistent@gov.bc.ca'
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userService.searchIdirEmail(email)

      expect(result).toEqual([])
    })

    it('should propagate errors from _searchIdirUsers', async () => {
      const email = 'test@gov.bc.ca'
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(userService.searchIdirEmail(email)).rejects.toThrow(error)
    })
  })

  describe('searchIdirFirstName', () => {
    it('should search IDIR users by first name', async () => {
      const firstName = 'John'
      const filteredUsers = [fakeIdirUsers[0]]
      mockGet.mockResolvedValueOnce({ data: { data: filteredUsers } })

      const result = await userService.searchIdirFirstName(firstName)

      expect(result).toEqual(filteredUsers)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { firstName },
      })
    })

    it('should handle case-insensitive searches', async () => {
      const firstName = 'john'
      mockGet.mockResolvedValueOnce({ data: { data: fakeIdirUsers } })

      const result = await userService.searchIdirFirstName(firstName)

      expect(result).toEqual(fakeIdirUsers)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { firstName },
      })
    })

    it('should handle partial name searches', async () => {
      const partialName = 'Jo'
      mockGet.mockResolvedValueOnce({ data: { data: fakeIdirUsers } })

      const result = await userService.searchIdirFirstName(partialName)

      expect(result).toEqual(fakeIdirUsers)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { firstName: partialName },
      })
    })

    it('should return empty array for no matches', async () => {
      const firstName = 'NonexistentName'
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userService.searchIdirFirstName(firstName)

      expect(result).toEqual([])
    })

    it('should propagate errors from _searchIdirUsers', async () => {
      const firstName = 'John'
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(userService.searchIdirFirstName(firstName)).rejects.toThrow(
        error,
      )
    })
  })

  describe('searchIdirLastName', () => {
    it('should search IDIR users by last name', async () => {
      const lastName = 'Smith'
      const filteredUsers = [fakeIdirUsers[1]]
      mockGet.mockResolvedValueOnce({ data: { data: filteredUsers } })

      const result = await userService.searchIdirLastName(lastName)

      expect(result).toEqual(filteredUsers)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { lastName },
      })
    })

    it('should handle case-insensitive searches', async () => {
      const lastName = 'smith'
      mockGet.mockResolvedValueOnce({ data: { data: fakeIdirUsers } })

      const result = await userService.searchIdirLastName(lastName)

      expect(result).toEqual(fakeIdirUsers)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { lastName },
      })
    })

    it('should handle partial name searches', async () => {
      const partialName = 'Sm'
      mockGet.mockResolvedValueOnce({ data: { data: fakeIdirUsers } })

      const result = await userService.searchIdirLastName(partialName)

      expect(result).toEqual(fakeIdirUsers)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { lastName: partialName },
      })
    })

    it('should return empty array for no matches', async () => {
      const lastName = 'NonexistentLastName'
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userService.searchIdirLastName(lastName)

      expect(result).toEqual([])
    })

    it('should propagate errors from _searchIdirUsers', async () => {
      const lastName = 'Smith'
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(userService.searchIdirLastName(lastName)).rejects.toThrow(
        error,
      )
    })
  })
})
