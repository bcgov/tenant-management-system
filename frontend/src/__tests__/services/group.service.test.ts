import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  makeGroupApiData,
  makeGroupUserApiData,
  makeSsoUser,
  makeSsoUserApiData,
  makeUser,
  makeUserApiData,
} from '@/__tests__/__factories__'

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

const { mockDelete, mockGet, mockPost } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}))

vi.mock('@/services/authenticated.axios', () => ({
  authenticatedAxios: () => ({
    delete: mockDelete,
    get: mockGet,
    post: mockPost,
  }),
}))

import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ValidationError } from '@/errors/domain/ValidationError'
import { groupService } from '@/services/group.service'
import { toUserId } from '@/models/user.model'
import { toSsoUserId } from '@/models/ssouser.model'

describe('groupService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addUserToGroup', () => {
    it('should correctly call the api', async () => {
      const user = makeUser({
        ssoUser: makeSsoUser({
          displayName: 'ssoUserDisplayName',
          email: 'ssoUserEmail',
          firstName: 'ssoUserFirstName',
          idpType: 'ssoUserIdpType',
          lastName: 'ssoUserLastName',
          ssoUserId: toSsoUserId('ssoUserSsoUserId'),
          userName: 'ssoUserUserName',
        }),
      })
      mockPost.mockResolvedValueOnce({ data: { data: {} } })

      await groupService.addUserToGroup(
        toTenantId('tenantId'),
        toGroupId('groupId'),
        user,
      )

      expect(mockPost).toHaveBeenCalledWith(
        '/tenants/tenantId/groups/groupId/users',
        {
          user: {
            displayName: 'ssoUserDisplayName',
            email: 'ssoUserEmail',
            firstName: 'ssoUserFirstName',
            idpType: 'ssoUserIdpType',
            lastName: 'ssoUserLastName',
            ssoUserId: 'ssoUserSsoUserId',
            userName: 'ssoUserUserName',
          },
        },
      )
    })

    it('should correctly call the api handling azureidir', async () => {
      const user = makeUser({
        ssoUser: makeSsoUser({
          idpType: 'azureidir',
        }),
      })
      mockPost.mockResolvedValueOnce({ data: { data: {} } })

      await groupService.addUserToGroup(
        toTenantId('tenantId'),
        toGroupId('groupId'),
        user,
      )

      expect(mockPost).toHaveBeenCalledWith(
        '/tenants/tenantId/groups/groupId/users',
        expect.objectContaining({
          user: expect.objectContaining({
            idpType: 'idir',
          }),
        }),
      )
    })

    it('should correctly return data', async () => {
      const groupUserApiData = makeGroupUserApiData({
        user: makeUserApiData({
          id: toUserId('userId'),
          ssoUser: makeSsoUserApiData({
            displayName: 'ssoUserDisplayName',
            email: 'ssoUserEmail',
            firstName: 'ssoUserFirstName',
            idpType: 'ssoUserIdpType',
            lastName: 'ssoUserLastName',
            ssoUserId: toSsoUserId('ssoUserSsoUserId'),
            userName: 'ssoUserUserName',
          }),
        }),
      })
      mockPost.mockResolvedValueOnce({
        data: { data: { groupUser: groupUserApiData } },
      })

      const result = await groupService.addUserToGroup(
        toTenantId('tenantId'),
        toGroupId('groupId'),
        makeUser(),
      )

      expect(result.user.ssoUser.displayName).toBe('ssoUserDisplayName')
      expect(result.user.ssoUser.email).toBe('ssoUserEmail')
      expect(result.user.ssoUser.firstName).toBe('ssoUserFirstName')
      expect(result.user.ssoUser.idpType).toBe('ssoUserIdpType')
      expect(result.user.ssoUser.lastName).toBe('ssoUserLastName')
      expect(result.user.ssoUser.ssoUserId).toBe('ssoUserSsoUserId')
      expect(result.user.ssoUser.userName).toBe('ssoUserUserName')
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const user = makeUser()
      const error = {
        isAxiosError: true,
        response: {
          data: { message: 'User already in group' },
          status: 409,
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        groupService.addUserToGroup(
          toTenantId('tenantId'),
          toGroupId('groupId'),
          user,
        ),
      ).rejects.toBeInstanceOf(DuplicateEntityError)
    })

    it('should throw ValidationError on HTTP 400', async () => {
      const user = makeUser()
      const error = {
        isAxiosError: true,
        response: {
          data: { details: { body: [{ message: 'Invalid user data' }] } },
          status: 400,
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isValidationError.mockReturnValueOnce(true)

      await expect(
        groupService.addUserToGroup(
          toTenantId('tenantId'),
          toGroupId('groupId'),
          user,
        ),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it('should log and rethrow unknown errors', async () => {
      const user = makeUser()
      const genericError = new Error('Network error')
      mockPost.mockRejectedValueOnce(genericError)

      await expect(
        groupService.addUserToGroup(
          toTenantId('tenantId'),
          toGroupId('groupId'),
          user,
        ),
      ).rejects.toThrow(genericError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error adding user to group',
        genericError,
      )
    })
  })

  describe('createGroup', () => {
    it('should correctly call the api', async () => {
      mockPost.mockResolvedValueOnce({ data: { data: {} } })

      await groupService.createGroup(
        toTenantId('tenantId'),
        'groupName',
        'groupDescription',
      )

      expect(mockPost).toHaveBeenCalledWith('/tenants/tenantId/groups', {
        description: 'groupDescription',
        name: 'groupName',
      })
    })

    it('should correctly return data', async () => {
      const groupApiData = makeGroupApiData({
        description: 'groupDescription',
        name: 'groupName',
      })
      mockPost.mockResolvedValueOnce({
        data: { data: { group: groupApiData } },
      })

      const result = await groupService.createGroup(
        toTenantId('tenantId'),
        'groupName',
        'groupDescription',
      )

      expect(result.description).toBe('groupDescription')
      expect(result.name).toBe('groupName')
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { message: 'Group already exists' },
          status: 409,
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        groupService.createGroup(
          toTenantId('tenantId'),
          'groupName',
          'groupDescription',
        ),
      ).rejects.toBeInstanceOf(DuplicateEntityError)
    })

    it('should throw ValidationError on HTTP 400 with validation errors', async () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { details: { body: [{ message: 'Name is required' }] } },
          status: 400,
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isValidationError.mockReturnValueOnce(true)

      await expect(
        groupService.createGroup(
          toTenantId('tenantId'),
          'groupName',
          'groupDescription',
        ),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it('should log and rethrow unknown errors', async () => {
      const genericError = new Error('Something went wrong')
      mockPost.mockRejectedValueOnce(genericError)

      await expect(
        groupService.createGroup(
          toTenantId('tenantId'),
          'groupName',
          'groupDescription',
        ),
      ).rejects.toThrow(genericError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error creating group',
        genericError,
      )
    })
  })

  describe('getGroup', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: {} } })

      await groupService.getGroup(toTenantId('tenantId'), toGroupId('groupId'))

      expect(mockGet).toHaveBeenCalledWith(
        '/tenants/tenantId/groups/groupId?expand=groupUsers',
      )
    })

    it('should correctly return data', async () => {
      const groupApiData = makeGroupApiData({
        description: 'groupDescription',
        name: 'groupName',
      })
      mockGet.mockResolvedValueOnce({
        data: { data: { group: groupApiData } },
      })

      const result = await groupService.getGroup(
        toTenantId('tenantId'),
        toGroupId('groupId'),
      )

      expect(result.description).toBe('groupDescription')
      expect(result.name).toBe('groupName')
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Group not found')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        groupService.getGroup(toTenantId('tenantId'), toGroupId('groupId')),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting group',
        error,
      )
    })
  })

  describe('getTenantGroups', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: {} } })

      await groupService.getTenantGroups(toTenantId('tenantId'))

      expect(mockGet).toHaveBeenCalledWith(`/tenants/tenantId/groups`)
    })

    it('should correctly return data', async () => {
      const groupApiData = makeGroupApiData({
        description: 'groupDescription',
        name: 'groupName',
      })
      mockGet.mockResolvedValueOnce({
        data: { data: { groups: [groupApiData] } },
      })

      const result = await groupService.getTenantGroups(toTenantId('tenantId'))

      expect(result[0].description).toBe('groupDescription')
      expect(result[0].name).toBe('groupName')
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Tenant not found')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        groupService.getTenantGroups(toTenantId('tenantId')),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant groups',
        error,
      )
    })
  })

  describe('removeUserFromGroup', () => {
    it('should correctly call the api', async () => {
      mockDelete.mockResolvedValueOnce({})

      await groupService.removeUserFromGroup(
        toTenantId('tenantId'),
        toGroupId('groupId'),
        toGroupUserId('gu-1'),
      )

      expect(mockDelete).toHaveBeenCalledWith(
        '/tenants/tenantId/groups/groupId/users/gu-1',
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('User not found in group')
      mockDelete.mockRejectedValueOnce(error)

      await expect(
        groupService.removeUserFromGroup(
          toTenantId('tenantId'),
          toGroupId('groupId'),
          toGroupUserId('gu-1'),
        ),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error removing user from group',
        error,
      )
    })
  })
})
