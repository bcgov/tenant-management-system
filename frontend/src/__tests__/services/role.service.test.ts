import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeRoleApiData } from '@/__tests__/__factories__'

import { roleService } from '@/services/role.service'
import * as utils from '@/services/utils'

vi.mock('@/services/config.service', () => ({
  config: { api: { baseUrl: 'https://api.example.com' } },
}))

vi.mock('@/services/utils', () => ({
  logApiError: vi.fn(),
}))

const mockedUtils = vi.mocked(utils)
mockedUtils.logApiError.mockImplementation(() => {})

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}))

vi.mock('@/services/api', () => ({
  authenticatedFetch: () => ({
    get: mockGet,
  }),
}))

describe('roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRoles', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValue({ data: { data: {} } })

      await roleService.getRoles()

      expect(mockGet).toHaveBeenCalledWith('/roles')
    })

    it('should correctly return data', async () => {
      const roleApiData = makeRoleApiData({
        description: 'roleDescription',
        name: 'roleName',
      })
      mockGet.mockResolvedValue({ data: { data: { roles: [roleApiData] } } })

      const result = await roleService.getRoles()

      expect(result).toHaveLength(1)
      expect(result[0].description).toBe('roleDescription')
      expect(result[0].name).toBe('roleName')
    })

    it('should log error and rethrow when API call fails', async () => {
      const mockError = new Error('Network error')
      mockGet.mockRejectedValueOnce(mockError)

      await expect(roleService.getRoles()).rejects.toThrow('Network error')

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting roles',
        mockError,
      )
    })

    it('should handle API errors with custom error objects', async () => {
      const mockApiError = {
        response: {
          data: { message: 'Internal server error' },
          status: 500,
        },
      }
      mockGet.mockRejectedValueOnce(mockApiError)

      await expect(roleService.getRoles()).rejects.toEqual(mockApiError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting roles',
        mockApiError,
      )
    })

    it('should handle empty roles response', async () => {
      mockGet.mockResolvedValue({ data: { data: { roles: [] } } })

      const result = await roleService.getRoles()

      expect(result).toEqual([])
    })
  })
})
