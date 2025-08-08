import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as utils from '@/services/utils'

vi.mock('@/services/utils', () => ({
  isDuplicateEntityError: vi.fn(),
  isValidationError: vi.fn(),
  logApiError: vi.fn(),
}))

const mockedUtils = vi.mocked(utils)

mockedUtils.isDuplicateEntityError.mockReturnValue(false)
mockedUtils.isValidationError.mockReturnValue(false)
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

import { DuplicateEntityError, ValidationError } from '@/errors'
import { groupService } from '@/services/group.service'

describe('groupService', () => {
  const tenantId = '1'
  const fakeGroup = {
    name: 'Test Group',
    description: 'Group description',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createGroup', () => {
    it('should return the created group on success', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: { group: fakeGroup } } })

      const result = await groupService.createGroup(
        tenantId,
        fakeGroup.name,
        fakeGroup.description,
      )

      expect(result).toEqual(fakeGroup)
      expect(mockPost).toHaveBeenCalledWith(
        `/tenants/${tenantId}/groups`,
        fakeGroup,
      )
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      mockPost.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 409, data: { errors: { field: 'duplicate' } } },
      })
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        groupService.createGroup(
          tenantId,
          fakeGroup.name,
          fakeGroup.description,
        ),
      ).rejects.toBeInstanceOf(DuplicateEntityError)
    })

    it('should throw ValidationError on HTTP 400 with validation errors', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { details: { body: [{ message: 'invalid' }] } },
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isValidationError.mockReturnValueOnce(true)

      await expect(
        groupService.createGroup(
          tenantId,
          fakeGroup.name,
          fakeGroup.description,
        ),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it('should log and rethrow unknown errors', async () => {
      const genericError = new Error('Something went wrong')
      mockPost.mockRejectedValueOnce(genericError)

      await expect(
        groupService.createGroup(
          tenantId,
          fakeGroup.name,
          fakeGroup.description,
        ),
      ).rejects.toThrow(genericError)
    })
  })
})
