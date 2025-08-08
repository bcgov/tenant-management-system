import { beforeEach, describe, expect, it, vi } from 'vitest'

// Create mock functions in vi.hoisted to ensure they're available during module loading
const { mockDelete, mockGet, mockPatch, mockPost, mockPut } = vi.hoisted(
  () => ({
    mockDelete: vi.fn(),
    mockGet: vi.fn(),
    mockPatch: vi.fn(),
    mockPost: vi.fn(),
    mockPut: vi.fn(),
  }),
)

// Mock the authenticated axios to return an object with HTTP methods
vi.mock('@/services/authenticated.axios', () => ({
  authenticatedAxios: () => ({
    delete: mockDelete,
    get: mockGet,
    patch: mockPatch,
    post: mockPost,
    put: mockPut,
  }),
}))

// Mock the utils
vi.mock('@/services/utils', () => ({
  logApiError: vi.fn(),
}))

// Import after mocks are set up
import { roleService } from '@/services'
import { logApiError } from '@/services/utils'

describe('roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRoles', () => {
    it('should return roles data on successful API call', async () => {
      // Arrange
      const mockRoles = [
        { id: 1, name: 'admin', permissions: ['read', 'write'] },
        { id: 2, name: 'user', permissions: ['read'] },
      ]
      const mockResponse = {
        data: {
          data: {
            roles: mockRoles,
          },
        },
      }

      mockGet.mockResolvedValue(mockResponse)

      // Act
      const result = await roleService.getRoles()

      // Assert
      expect(mockGet).toHaveBeenCalledWith('/roles')
      expect(result).toEqual(mockRoles)
      expect(logApiError).not.toHaveBeenCalled()
    })

    it('should log error and rethrow when API call fails', async () => {
      // Arrange
      const mockError = new Error('Network error')
      mockGet.mockRejectedValue(mockError)

      // Act & Assert
      await expect(roleService.getRoles()).rejects.toThrow('Network error')

      expect(mockGet).toHaveBeenCalledWith('/roles')
      expect(logApiError).toHaveBeenCalledWith('Error getting roles', mockError)
    })

    it('should handle API errors with custom error objects', async () => {
      // Arrange
      const mockApiError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      }
      mockGet.mockRejectedValue(mockApiError)

      // Act & Assert
      await expect(roleService.getRoles()).rejects.toEqual(mockApiError)

      expect(logApiError).toHaveBeenCalledWith(
        'Error getting roles',
        mockApiError,
      )
    })

    it('should handle empty roles response', async () => {
      // Arrange
      const mockResponse = {
        data: {
          data: {
            roles: [],
          },
        },
      }
      mockGet.mockResolvedValue(mockResponse)

      // Act
      const result = await roleService.getRoles()

      // Assert
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })
  })
})
