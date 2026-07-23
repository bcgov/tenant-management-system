import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as utils from '@/services/utils'

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

import { userService } from '@/services/user.service'
import { makeUserSearchApiData } from '../__factories__'

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('searchBceidDisplayName', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: {} })

      await userService.searchBCeIDDisplayName('displayName')

      expect(mockGet).toHaveBeenCalledWith(
        '/users/bcgovssousers/bceid/search',
        {
          params: { bceidType: 'business', displayName: 'displayName' },
        },
      )
    })

    it('should correctly return data', async () => {
      const userApiData = makeUserSearchApiData({
        attributes: { attributeKey: ['attributeValue'] },
        email: 'userSearchEmail',
        firstName: 'userSearchFirstName',
        lastName: 'userSearchLastName',
      })
      mockGet.mockResolvedValueOnce({ data: { data: [userApiData] } })

      const result = await userService.searchBCeIDDisplayName('displayName')

      expect(result).toHaveLength(1)
      expect(result[0].attributes.attributeKey).toHaveLength(1)
      expect(result[0].attributes?.attributeKey?.at(0)).toBe('attributeValue')
      expect(result[0].email).toBe('userSearchEmail')
      expect(result[0].firstName).toBe('userSearchFirstName')
      expect(result[0].lastName).toBe('userSearchLastName')
    })

    it('should return empty array for no matches', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userService.searchBCeIDDisplayName('displayName')

      expect(result).toEqual([])
    })

    it('should propagate errors from _searchBCeIDUsers', async () => {
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        userService.searchBCeIDDisplayName('displayName'),
      ).rejects.toThrow(error)
    })
  })

  describe('searchBceidEmail', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: {} })

      await userService.searchBCeIDEmail('email')

      expect(mockGet).toHaveBeenCalledWith(
        '/users/bcgovssousers/bceid/search',
        {
          params: { bceidType: 'business', email: 'email' },
        },
      )
    })

    it('should correctly return data', async () => {
      const userApiData = makeUserSearchApiData({
        attributes: { attributeKey: ['attributeValue'] },
        email: 'userSearchEmail',
        firstName: 'userSearchFirstName',
        lastName: 'userSearchLastName',
      })
      mockGet.mockResolvedValueOnce({ data: { data: [userApiData] } })

      const result = await userService.searchBCeIDEmail('email')

      expect(result).toHaveLength(1)
      expect(result[0].attributes.attributeKey).toHaveLength(1)
      expect(result[0].attributes?.attributeKey?.at(0)).toBe('attributeValue')
      expect(result[0].email).toBe('userSearchEmail')
      expect(result[0].firstName).toBe('userSearchFirstName')
      expect(result[0].lastName).toBe('userSearchLastName')
    })

    it('should return empty array for no matches', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userService.searchBCeIDEmail('email')

      expect(result).toEqual([])
    })

    it('should propagate errors from _searchBCeIDUsers', async () => {
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(userService.searchBCeIDEmail('email')).rejects.toThrow(error)
    })
  })

  describe('searchIdirEmail', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: {} })

      await userService.searchIdirEmail('email')

      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { email: 'email' },
      })
    })

    it('should correctly return data', async () => {
      const userApiData = makeUserSearchApiData({
        attributes: { attributeKey: ['attributeValue'] },
        email: 'userSearchEmail',
        firstName: 'userSearchFirstName',
        lastName: 'userSearchLastName',
      })
      mockGet.mockResolvedValueOnce({ data: { data: [userApiData] } })

      const result = await userService.searchIdirEmail('email')

      expect(result).toHaveLength(1)
      expect(result[0].attributes.attributeKey).toHaveLength(1)
      expect(result[0].attributes?.attributeKey?.at(0)).toBe('attributeValue')
      expect(result[0].email).toBe('userSearchEmail')
      expect(result[0].firstName).toBe('userSearchFirstName')
      expect(result[0].lastName).toBe('userSearchLastName')
    })

    it('should return empty array for no matches', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userService.searchIdirEmail('email')

      expect(result).toEqual([])
    })

    it('should propagate errors from _searchBCeIDUsers', async () => {
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(userService.searchIdirEmail('email')).rejects.toThrow(error)
    })
  })

  describe('searchIdirFirstName', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: {} })

      await userService.searchIdirFirstName('firstName')

      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { firstName: 'firstName' },
      })
    })

    it('should correctly return data', async () => {
      const userApiData = makeUserSearchApiData({
        attributes: { attributeKey: ['attributeValue'] },
        email: 'userSearchEmail',
        firstName: 'userSearchFirstName',
        lastName: 'userSearchLastName',
      })
      mockGet.mockResolvedValueOnce({ data: { data: [userApiData] } })

      const result = await userService.searchIdirFirstName('firstName')

      expect(result).toHaveLength(1)
      expect(result[0].attributes.attributeKey).toHaveLength(1)
      expect(result[0].attributes?.attributeKey?.at(0)).toBe('attributeValue')
      expect(result[0].email).toBe('userSearchEmail')
      expect(result[0].firstName).toBe('userSearchFirstName')
      expect(result[0].lastName).toBe('userSearchLastName')
    })

    it('should return empty array for no matches', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userService.searchIdirFirstName('firstName')

      expect(result).toEqual([])
    })

    it('should propagate errors from _searchBCeIDUsers', async () => {
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        userService.searchIdirFirstName('firstName'),
      ).rejects.toThrow(error)
    })
  })

  describe('searchIdirLastName', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: {} })

      await userService.searchIdirLastName('lastName')

      expect(mockGet).toHaveBeenCalledWith('/users/bcgovssousers/idir/search', {
        params: { lastName: 'lastName' },
      })
    })

    it('should correctly return data', async () => {
      const userApiData = makeUserSearchApiData({
        attributes: { attributeKey: ['attributeValue'] },
        email: 'userSearchEmail',
        firstName: 'userSearchFirstName',
        lastName: 'userSearchLastName',
      })
      mockGet.mockResolvedValueOnce({ data: { data: [userApiData] } })

      const result = await userService.searchIdirLastName('lastName')

      expect(result).toHaveLength(1)
      expect(result[0].attributes.attributeKey).toHaveLength(1)
      expect(result[0].attributes?.attributeKey?.at(0)).toBe('attributeValue')
      expect(result[0].email).toBe('userSearchEmail')
      expect(result[0].firstName).toBe('userSearchFirstName')
      expect(result[0].lastName).toBe('userSearchLastName')
    })

    it('should return empty array for no matches', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: [] } })

      const result = await userService.searchIdirLastName('lastName')

      expect(result).toEqual([])
    })

    it('should propagate errors from _searchBCeIDUsers', async () => {
      const error = new Error('Search failed')
      mockGet.mockRejectedValueOnce(error)

      await expect(userService.searchIdirLastName('lastName')).rejects.toThrow(
        error,
      )
    })
  })
})
