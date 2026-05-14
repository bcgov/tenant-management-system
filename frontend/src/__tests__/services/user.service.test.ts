import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as utils from '@/services/utils'

vi.mock('@/services/utils', () => ({
  logApiError: vi.fn(),
}))

const mockedUtils = vi.mocked(utils)

mockedUtils.logApiError.mockImplementation(() => {})

// Create mock functions in vi.hoisted to ensure they're available during module
// loading.
const { mockDelete, mockGet, mockPatch, mockPost, mockPut } = vi.hoisted(
  () => ({
    mockDelete: vi.fn(),
    mockGet: vi.fn(),
    mockPatch: vi.fn(),
    mockPost: vi.fn(),
    mockPut: vi.fn(),
  }),
)

// Mock the authenticated axios to return an object with HTTP methods.
vi.mock('@/services/authenticated.axios', () => ({
  authenticatedAxios: () => ({
    delete: mockDelete,
    get: mockGet,
    patch: mockPatch,
    post: mockPost,
    put: mockPut,
  }),
}))

import { userService } from '@/services/user.service'

describe('userService', () => {
  const fakeBceidUsers = [
    {
      ssoUserId: '456',
      email: 'bob.johnson@gov.bc.ca',
      firstName: 'Bob',
      lastName: 'Johnson',
      displayName: 'Johnson, Bob',
      userName: 'BJOHNSON',
    },
    {
      ssoUserId: '457',
      email: 'alice.wilson@gov.bc.ca',
      firstName: 'Alice',
      lastName: 'Wilson',
      displayName: 'Wilson, Alice',
      userName: 'AWILSON',
    },
  ]

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

  describe('searchBCeIDDisplayName', () => {
    it('should search BCeID users by display name', async () => {
      const displayName = 'Smith'
      const filteredUsers = [fakeBceidUsers[1]]
      mockGet.mockResolvedValueOnce({ data: { data: filteredUsers } })

      const result = await userService.searchBCeIDDisplayName(displayName)

      expect(result).toEqual(filteredUsers)
      expect(mockGet).toHaveBeenCalledWith(
        '/users/bcgovssousers/bceid/search',
        {
          params: { displayName: displayName, bceidType: 'both' },
        },
      )
    })

    it('should handle case-insensitive searches', async () => {
      const displayName = 'smith'
      mockGet.mockResolvedValueOnce({ data: { data: fakeBceidUsers } })

      const result = await userService.searchBCeIDDisplayName(displayName)

      expect(result).toEqual(fakeBceidUsers)
      expect(mockGet).toHaveBeenCalledWith(
        '/users/bcgovssousers/bceid/search',
        {
          params: { displayName: displayName, bceidType: 'both' },
        },
      )
    })

    it('should handle partial name searches', async () => {
      const partialName = 'Sm'
      mockGet.mockResolvedValueOnce({ data: { data: fakeBceidUsers } })

      const result = await userService.searchBCeIDDisplayName(partialName)

      expect(result).toEqual(fakeBceidUsers)
      expect(mockGet).toHaveBeenCalledWith(
        '/users/bcgovssousers/bceid/search',
        {
          params: { displayName: partialName, bceidType: 'both' },
        },
      )
    })

    it('should return empty array for no matches', async () => {
      const displayName = 'NonexistentName'
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userService.searchBCeIDDisplayName(displayName)

      expect(result).toEqual([])
    })

    it('should propagate errors from _searchBCeIDUsers', async () => {
      const displayName = 'Smith'
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        userService.searchBCeIDDisplayName(displayName),
      ).rejects.toThrow(error)
    })
  })

  describe('searchBCeIDEmail', () => {
    it('should search BCeID users by email', async () => {
      const email = 'smith@gov.bc.ca'
      const filteredUsers = [fakeBceidUsers[1]]
      mockGet.mockResolvedValueOnce({ data: { data: filteredUsers } })

      const result = await userService.searchBCeIDEmail(email)

      expect(result).toEqual(filteredUsers)
      expect(mockGet).toHaveBeenCalledWith(
        '/users/bcgovssousers/bceid/search',
        {
          params: { email: email, bceidType: 'both' },
        },
      )
    })

    it('should handle case-insensitive searches', async () => {
      const email = 'smith@gov.bc.ca'
      mockGet.mockResolvedValueOnce({ data: { data: fakeBceidUsers } })

      const result = await userService.searchBCeIDEmail(email)

      expect(result).toEqual(fakeBceidUsers)
      expect(mockGet).toHaveBeenCalledWith(
        '/users/bcgovssousers/bceid/search',
        {
          params: { email: email, bceidType: 'both' },
        },
      )
    })

    it('should handle partial email searches', async () => {
      const partialEmail = 'smith@'
      mockGet.mockResolvedValueOnce({ data: { data: fakeBceidUsers } })

      const result = await userService.searchBCeIDEmail(partialEmail)

      expect(result).toEqual(fakeBceidUsers)
      expect(mockGet).toHaveBeenCalledWith(
        '/users/bcgovssousers/bceid/search',
        {
          params: { email: partialEmail, bceidType: 'both' },
        },
      )
    })

    it('should return empty array for no matches', async () => {
      const email = 'nonexistent@gov.bc.ca'
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userService.searchBCeIDEmail(email)

      expect(result).toEqual([])
    })

    it('should propagate errors from _searchBCeIDUsers', async () => {
      const email = 'smith@gov.bc.ca'
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(userService.searchBCeIDEmail(email)).rejects.toThrow(error)
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
