import { beforeEach, describe, expect, it, vi } from 'vitest'

import { makeSsoUser, makeUser } from '@/__tests__/__factories__'

import { toGroupId } from '@/models/group.model'
import { toGroupUserId } from '@/models/groupuser.model'
import { toTenantId } from '@/models/tenant.model'
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

import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ValidationError } from '@/errors/domain/ValidationError'
import { groupService } from '@/services/group.service'

describe('groupService', () => {
  const tenantId = toTenantId('1')
  const groupId = toGroupId('123')
  const groupUserId = toGroupUserId('456')

  const fakeGroup = {
    id: groupId,
    name: 'Test Group',
    description: 'Group description',
  }

  const fakeUser = makeUser()
  const fakeAzureUser = makeUser({
    ssoUser: makeSsoUser({ idpType: 'azureidir' }),
  })

  const fakeGroupUser = {
    id: groupUserId,
    user: fakeUser,
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
      expect(mockPost).toHaveBeenCalledWith(`/tenants/${tenantId}/groups`, {
        name: fakeGroup.name,
        description: fakeGroup.description,
      })
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 409,
          data: { message: 'Group already exists' },
        },
      }
      mockPost.mockRejectedValueOnce(error)
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
          data: { details: { body: [{ message: 'Name is required' }] } },
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

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error creating group',
        genericError,
      )
    })
  })

  describe('addUserToGroup', () => {
    it('should return the group user on success', async () => {
      mockPost.mockResolvedValueOnce({
        data: { data: { groupUser: fakeGroupUser } },
      })

      const result = await groupService.addUserToGroup(
        tenantId,
        groupId,
        fakeUser,
      )

      expect(result).toEqual(fakeGroupUser)
      expect(mockPost).toHaveBeenCalledWith(
        `/tenants/${tenantId}/groups/${groupId}/users`,
        {
          user: {
            displayName: fakeUser.ssoUser.displayName,
            email: fakeUser.ssoUser.email,
            firstName: fakeUser.ssoUser.firstName,
            idpType: fakeUser.ssoUser.idpType,
            lastName: fakeUser.ssoUser.lastName,
            ssoUserId: fakeUser.ssoUser.ssoUserId,
            userName: fakeUser.ssoUser.userName,
          },
        },
      )
    })

    it('should return the group user handling azureidir', async () => {
      mockPost.mockResolvedValueOnce({
        data: { data: { groupUser: fakeGroupUser } },
      })

      const result = await groupService.addUserToGroup(
        tenantId,
        groupId,
        fakeAzureUser,
      )

      expect(result).toEqual(fakeGroupUser)
      expect(mockPost).toHaveBeenCalledWith(
        `/tenants/${tenantId}/groups/${groupId}/users`,
        {
          user: {
            displayName: fakeAzureUser.ssoUser.displayName,
            email: fakeAzureUser.ssoUser.email,
            firstName: fakeAzureUser.ssoUser.firstName,
            idpType: 'idir',
            lastName: fakeAzureUser.ssoUser.lastName,
            ssoUserId: fakeAzureUser.ssoUser.ssoUserId,
            userName: fakeAzureUser.ssoUser.userName,
          },
        },
      )
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 409,
          data: { message: 'User already in group' },
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        groupService.addUserToGroup(tenantId, groupId, fakeUser),
      ).rejects.toBeInstanceOf(DuplicateEntityError)
    })

    it('should throw ValidationError on HTTP 400 with validation errors', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { details: { body: [{ message: 'Invalid user data' }] } },
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isValidationError.mockReturnValueOnce(true)

      await expect(
        groupService.addUserToGroup(tenantId, groupId, fakeUser),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it('should log and rethrow unknown errors', async () => {
      const genericError = new Error('Network error')
      mockPost.mockRejectedValueOnce(genericError)

      await expect(
        groupService.addUserToGroup(tenantId, groupId, fakeUser),
      ).rejects.toThrow(genericError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error adding user to group',
        genericError,
      )
    })
  })

  describe('getGroup', () => {
    it('should return the group on success', async () => {
      const groupWithUsers = { ...fakeGroup, groupUsers: [fakeGroupUser] }
      mockGet.mockResolvedValueOnce({
        data: { data: { group: groupWithUsers } },
      })

      const result = await groupService.getGroup(tenantId, groupId)

      expect(result).toEqual(groupWithUsers)
      expect(mockGet).toHaveBeenCalledWith(
        `/tenants/${tenantId}/groups/${groupId}?expand=groupUsers`,
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Group not found')
      mockGet.mockRejectedValueOnce(error)

      await expect(groupService.getGroup(tenantId, groupId)).rejects.toThrow(
        error,
      )

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting group',
        error,
      )
    })
  })

  describe('getTenantGroups', () => {
    it('should return all groups for a tenant on success', async () => {
      const groups = [
        fakeGroup,
        { ...fakeGroup, id: '124', name: 'Another Group' },
      ]
      mockGet.mockResolvedValueOnce({ data: { data: { groups } } })

      const result = await groupService.getTenantGroups(tenantId)

      expect(result).toEqual(groups)
      expect(mockGet).toHaveBeenCalledWith(`/tenants/${tenantId}/groups`)
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Tenant not found')
      mockGet.mockRejectedValueOnce(error)

      await expect(groupService.getTenantGroups(tenantId)).rejects.toThrow(
        error,
      )

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant groups',
        error,
      )
    })
  })

  describe('removeUserFromGroup', () => {
    it('should successfully remove user from group', async () => {
      mockDelete.mockResolvedValueOnce({})

      await groupService.removeUserFromGroup(tenantId, groupId, groupUserId)

      expect(mockDelete).toHaveBeenCalledWith(
        `/tenants/${tenantId}/groups/${groupId}/users/${groupUserId}`,
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('User not found in group')
      mockDelete.mockRejectedValueOnce(error)

      await expect(
        groupService.removeUserFromGroup(tenantId, groupId, groupUserId),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error removing user from group',
        error,
      )
    })
  })
})
