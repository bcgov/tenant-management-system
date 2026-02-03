import { setActivePinia, createPinia } from 'pinia'
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
  BCeID_SEARCH_TYPE: {
    EMAIL: { value: 'email' },
    DISPLAY_NAME: { value: 'displayName' },
  },
}))

import { useUserStore } from '@/stores/useUserStore'
let userStore = null

describe('useUserStore', () => {

  const fakeIdirUsers = [
    {
      ssoUserId: '123',
      email: 'john.doe@gov.bc.ca',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'Doe, John',
      userName: 'JDOE',
      attributes: {
        idir_use_guid: '123',
      }
    },
    {
      ssoUserId: '124',
      email: 'jane.smith@gov.bc.ca',
      firstName: 'Jane',
      lastName: 'Smith',
      displayName: 'Smith, Jane',
      userName: 'JSMITH',
      attributes: {
        idir_use_guid: '124',
      }
    },
  ]

  const fakeBceidUsers = [
    {
      ssoUserId: '456',
      email: 'bob.johnson@gov.bc.ca',
      firstName: 'Bob',
      lastName: 'Johnson',
      displayName: 'Johnson, Bob',
      userName: 'BJOHNSON',
      attributes: {
        idir_use_guid: '125',
      }
    },
    {
      ssoUserId: '457',
      email: 'alice.wilson@gov.bc.ca',
      firstName: 'Alice',
      lastName: 'Wilson',
      displayName: 'Wilson, Alice',
      userName: 'AWILSON',
      attributes: {
        idir_use_guid: '126',
      }
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    userStore = useUserStore()
  })

  describe('searchIdirEmail', () => {
    it('should search IDIR users by email', async () => {
      const email = 'john.doe@gov.bc.ca'
      const filteredUsers = [fakeIdirUsers[0]]
      mockGet.mockResolvedValueOnce({ data: { data: filteredUsers } })

      const result = await userStore.searchIdirEmail(email)

      expect(result).toHaveLength(1)
      expect(result[0].ssoUser.email).toBe(fakeIdirUsers[0].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { email },
      })
    })

    it('should handle partial email searches', async () => {
      const partialEmail = 'john'
      mockGet.mockResolvedValueOnce({ data: { data: [fakeIdirUsers[0]] } })

      const result = await userStore.searchIdirEmail(partialEmail)

      expect(result).toHaveLength(1)
      expect(result[0].ssoUser.email).toBe(fakeIdirUsers[0].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { email: partialEmail },
      })
    })

    it('should return empty array for no matches', async () => {
      const email = 'nonexistent@gov.bc.ca'
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userStore.searchIdirEmail(email)

      expect(result).toEqual([])
    })

    it('should propagate errors from searchIdirUsers', async () => {
      const email = 'test@gov.bc.ca'
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(userStore.searchIdirEmail(email)).rejects.toThrow(error)
    })
  })

  describe('searchIdirFirstName', () => {
    it('should search IDIR users by first name', async () => {
      const firstName = 'John'
      const filteredUsers = [fakeIdirUsers[0]]
      mockGet.mockResolvedValueOnce({ data: { data: filteredUsers } })

      const result = await userStore.searchIdirFirstName(firstName)

      expect(result).toHaveLength(1)
      expect(result[0].ssoUser.email).toEqual(fakeIdirUsers[0].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { firstName },
      })
    })

    it('should handle case-insensitive searches', async () => {
      const firstName = 'john'
      mockGet.mockResolvedValueOnce({ data: { data: [fakeIdirUsers[0]] } })

      const result = await userStore.searchIdirFirstName(firstName)

      expect(result).toHaveLength(1)
      expect(result[0].ssoUser.email).toBe(fakeIdirUsers[0].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { firstName },
      })
    })

    it('should handle partial name searches', async () => {
      const partialName = 'Jo'
      mockGet.mockResolvedValueOnce({ data: { data: [fakeIdirUsers[0]] } })

      const result = await userStore.searchIdirFirstName(partialName)

      expect(result).toHaveLength(1)
      expect(result[0].ssoUser.email).toBe(fakeIdirUsers[0].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { firstName: partialName },
      })
    })

    it('should return empty array for no matches', async () => {
      const firstName = 'NonexistentName'
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userStore.searchIdirFirstName(firstName)

      expect(result).toEqual([])
    })

    it('should propagate errors from searchIdirUsers', async () => {
      const firstName = 'John'
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(userStore.searchIdirFirstName(firstName)).rejects.toThrow(
        error,
      )
    })
  })

  describe('searchIdirLastName', () => {
    it('should search IDIR users by last name', async () => {
      const lastName = 'Smith'
      const filteredUsers = [fakeIdirUsers[1]]
      mockGet.mockResolvedValueOnce({ data: { data: filteredUsers } })

      const result = await userStore.searchIdirLastName(lastName)

      expect(result).toHaveLength(1)
      expect(result[0].ssoUser.email).toBe(fakeIdirUsers[1].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { lastName },
      })
    })

    it('should handle case-insensitive searches', async () => {
      const lastName = 'smith'
      mockGet.mockResolvedValueOnce({ data: { data: [fakeIdirUsers[1]] } })

      const result = await userStore.searchIdirLastName(lastName)

      expect(result).toHaveLength(1)
      expect(result[0].ssoUser.email).toBe(fakeIdirUsers[1].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { lastName },
      })
    })

    it('should handle partial name searches', async () => {
      const partialName = 'Sm'
      mockGet.mockResolvedValueOnce({ data: { data: [fakeIdirUsers[1]] } })

      const result = await userStore.searchIdirLastName(partialName)

      expect(result).toHaveLength(1)
      expect(result[0].ssoUser.email).toBe(fakeIdirUsers[1].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { lastName: partialName },
      })
    })

    it('should return empty array for no matches', async () => {
      const lastName = 'NonexistentLastName'
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userStore.searchIdirLastName(lastName)

      expect(result).toEqual([])
    })

    it('should propagate errors from searchIdirUsers', async () => {
      const lastName = 'Smith'
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(userStore.searchIdirLastName(lastName)).rejects.toThrow(
        error,
      )
    })
  })


  //bceid searches
  describe('searchBCeIDDisplayName', () => {
    it('should search BCeID users by display name', async () => {
      const displayName = 'Smith'
      const filteredUsers = [fakeBceidUsers[1]]
      mockGet.mockResolvedValueOnce({ data: { data: filteredUsers } })

      const result = await userStore.searchBCeIDDisplayName(displayName)

      expect(result).toHaveLength(1)
      expect(result[0].ssoUser.email).toBe(filteredUsers[0].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/bceid/search', {
        params: { displayName: displayName, bceidType: 'both'},
      })
    })

    it('should handle case-insensitive searches', async () => {
      const displayName = 'smith'
      mockGet.mockResolvedValueOnce({ data: { data: fakeBceidUsers } })

      const result = await userStore.searchBCeIDDisplayName(displayName)

      expect(result).toHaveLength(fakeBceidUsers.length)
      expect(result[0].ssoUser.email).toBe(fakeBceidUsers[0].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/bceid/search', {
        params: { displayName: displayName, bceidType: 'both' },
      })
    })

    it('should handle partial name searches', async () => {
      const partialName = 'Sm'
      mockGet.mockResolvedValueOnce({ data: { data: fakeBceidUsers } })

      const result = await userStore.searchBCeIDDisplayName(partialName)

      expect(result).toHaveLength(fakeBceidUsers.length)
      expect(result[0].ssoUser.email).toBe(fakeBceidUsers[0].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/bceid/search', {
        params: { displayName: partialName, bceidType: 'both' },
      })
    })

    it('should return empty array for no matches', async () => {
      const displayName = 'NonexistentName'
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userStore.searchBCeIDDisplayName(displayName)

      expect(result).toEqual([])
    })

    it('should propagate errors from searchBCeIDUsers', async () => {
      const displayName = 'Smith'
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(userStore.searchBCeIDDisplayName(displayName)).rejects.toThrow(
        error,
      )
    })
  })

  describe('searchBCeIDUsersEmail', () => {
    it('should return BCeID users for email search', async () => {
      const searchValue = 'bob.johnson@gov.bc.ca'
      mockGet.mockResolvedValueOnce({ data: { data: [fakeBceidUsers[0]] } })

      const result = await userStore.searchBCeIDEmail(searchValue)

      expect(result).toHaveLength(1)
      expect(result[0].ssoUser.email).toBe(fakeBceidUsers[0].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/bceid/search', {
        params: { email: searchValue, bceidType: 'both' },
      })
    })

    it('should return bceid users for displayName search', async () => {
      const searchValue = 'Bob'
      mockGet.mockResolvedValueOnce({ data: { data: [fakeBceidUsers[0]] } })

      const result = await userStore.searchBCeIDDisplayName(
        searchValue,
      )

      expect(result).toHaveLength(1)
      expect(result[0].ssoUser.email).toBe(fakeBceidUsers[0].email)
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/bceid/search', {
        params: { displayName: searchValue, bceidType: 'both' },
      })
    })

    it('should return empty array when no users found', async () => {
      const searchValue = 'nonexistent@gov.bc.ca'
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userStore.searchBCeIDEmail(searchValue)

      expect(result).toEqual([])
      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/bceid/search', {
        params: { email: searchValue, bceidType: 'both'  },
      })
    })

    it('should log and rethrow errors', async () => {
      const searchValue = 'test@gov.bc.ca'
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        userStore.searchBCeIDEmail(searchValue),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error searching BCeID users:',
        error,
      )
    })
  })

})
