import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  makeRole,
  makeRoleApiData,
  makeSsoUser,
  makeSsoUserApiData,
  makeTenantApiData,
  makeUser,
  makeUserApiData,
} from '@/__tests__/__factories__'

import { toRoleId } from '@/models/role.model'
import { toSsoUserId } from '@/models/ssouser.model'
import { toTenantId } from '@/models/tenant.model'
import { toUserId } from '@/models/user.model'
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

const { mockDelete, mockGet, mockPost, mockPut } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
}))

vi.mock('@/services/authenticated.axios', () => ({
  authenticatedAxios: () => ({
    delete: mockDelete,
    get: mockGet,
    post: mockPost,
    put: mockPut,
  }),
}))

import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ValidationError } from '@/errors/domain/ValidationError'
import { tenantService } from '@/services/tenant.service'

describe('tenantService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addUser', () => {
    it('should correctly call the api', async () => {
      const user = makeUser({
        id: toUserId('userId'),
        roles: [
          makeRole({
            description: 'roleDescription',
            id: toRoleId('roleId'),
            name: 'roleName',
          }),
        ],
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

      await tenantService.addUser(toTenantId('t-1'), user)

      expect(mockPost).toHaveBeenCalledWith('/tenants/t-1/users', {
        roles: ['roleId'],
        user: {
          displayName: user.ssoUser.displayName,
          email: user.ssoUser.email,
          firstName: user.ssoUser.firstName,
          idpType: user.ssoUser.idpType,
          lastName: user.ssoUser.lastName,
          ssoUserId: user.ssoUser.ssoUserId,
          userName: user.ssoUser.userName,
        },
      })
    })

    it('should correctly return data', async () => {
      const userApiData = makeUserApiData({
        id: toUserId('userId'),
        roles: [
          makeRoleApiData({
            description: 'roleDescription',
            id: toRoleId('roleId'),
            name: 'roleName',
          }),
        ],
        ssoUser: makeSsoUserApiData({
          displayName: 'ssoUserDisplayName',
          email: 'ssoUserEmail',
          firstName: 'ssoUserFirstName',
          idpType: 'ssoUserIdpType',
          lastName: 'ssoUserLastName',
          ssoUserId: toSsoUserId('ssoUserSsoUserId'),
          userName: 'ssoUserUserName',
        }),
      })
      mockPost.mockResolvedValueOnce({ data: { data: { user: userApiData } } })

      const result = await tenantService.addUser(toTenantId('t-1'), makeUser())

      expect(result.id).toBe('userId')
      expect(result.roles).toHaveLength(1)
      expect(result.roles?.at(0)?.description).toBe('roleDescription')
      expect(result.roles?.at(0)?.id).toBe('roleId')
      expect(result.roles?.at(0)?.name).toBe('roleName')
      expect(result.ssoUser.displayName).toBe('ssoUserDisplayName')
      expect(result.ssoUser.email).toBe('ssoUserEmail')
      expect(result.ssoUser.firstName).toBe('ssoUserFirstName')
      expect(result.ssoUser.idpType).toBe('ssoUserIdpType')
      expect(result.ssoUser.lastName).toBe('ssoUserLastName')
      expect(result.ssoUser.ssoUserId).toBe('ssoUserSsoUserId')
      expect(result.ssoUser.userName).toBe('ssoUserUserName')
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { message: 'User already exists in tenant' },
          status: 409,
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        tenantService.addUser(toTenantId('t-1'), makeUser()),
      ).rejects.toBeInstanceOf(DuplicateEntityError)
    })

    it('should log and rethrow unknown errors', async () => {
      const genericError = new Error('Something went wrong')
      mockPost.mockRejectedValueOnce(genericError)

      await expect(
        tenantService.addUser(toTenantId('t-1'), makeUser()),
      ).rejects.toThrow(genericError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error adding user to tenant',
        genericError,
      )
    })
  })

  describe('assignUserRoles', () => {
    it('should correctly call the api', async () => {
      mockPost.mockResolvedValueOnce({})

      await tenantService.assignUserRoles(toTenantId('t-1'), toUserId('u-1'), [
        toRoleId('r-1'),
      ])

      expect(mockPost).toHaveBeenCalledWith('/tenants/t-1/users/u-1/roles', {
        roles: ['r-1'],
      })
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to assign role')
      mockPost.mockRejectedValueOnce(error)

      await expect(
        tenantService.assignUserRoles(toTenantId('t-1'), toUserId('u-1'), [
          toRoleId('r-1'),
        ]),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error assigning user role in tenant',
        error,
      )
    })
  })

  describe('getTenant', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: {} } })

      await tenantService.getTenant(toTenantId('t-1'))

      expect(mockGet).toHaveBeenCalledWith(
        '/tenants/t-1?expand=tenantUserRoles',
      )
    })

    it('should correctly return data', async () => {
      const tenantApiData = makeTenantApiData({
        createdBy: 'tenantCreatedBy',
        createdDateTime: 'tenantCreatedDateTime',
        description: 'tenantDescription',
        id: toTenantId('tenantId'),
        ministryName: 'tenantMinistryName',
        name: 'tenantName',
        users: [makeUserApiData()],
      })
      mockGet.mockResolvedValueOnce({
        data: { data: { tenant: tenantApiData } },
      })

      const result = await tenantService.getTenant(toTenantId('t-1'))

      expect(result.createdBy).toBe('tenantCreatedBy')
      expect(result.createdDateTime).toBe('tenantCreatedDateTime')
      expect(result.description).toBe('tenantDescription')
      expect(result.id).toBe('tenantId')
      expect(result.ministryName).toBe('tenantMinistryName')
      expect(result.name).toBe('tenantName')
      expect(result.users).toHaveLength(1)
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Tenant not found')
      mockGet.mockRejectedValueOnce(error)

      await expect(tenantService.getTenant(toTenantId('t-1'))).rejects.toThrow(
        error,
      )

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant',
        error,
      )
    })
  })

  describe('getTenantRoles', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: {} } })

      await tenantService.getTenantRoles(toTenantId('t-1'))

      expect(mockGet).toHaveBeenCalledWith('/tenants/t-1/roles')
    })

    it('should correctly return data', async () => {
      const roleApiData = makeRoleApiData({
        description: 'roleDescription',
        id: toRoleId('roleId'),
        name: 'roleName',
      })
      mockGet.mockResolvedValueOnce({
        data: { data: { roles: [roleApiData] } },
      })

      const result = await tenantService.getTenantRoles(toTenantId('t-1'))

      expect(result).toHaveLength(1)
      expect(result[0].description).toBe('roleDescription')
      expect(result[0].id).toBe('roleId')
      expect(result[0].name).toBe('roleName')
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch roles')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        tenantService.getTenantRoles(toTenantId('t-1')),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant roles',
        error,
      )
    })
  })

  describe('getUserRoles', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: {} } })

      await tenantService.getUserRoles(toTenantId('t-1'), toUserId('u-1'))

      expect(mockGet).toHaveBeenCalledWith('/tenants/t-1/users/u-1/roles')
    })

    it('should correctly return data', async () => {
      const roleApiData = makeRoleApiData({
        description: 'roleDescription',
        id: toRoleId('roleId'),
        name: 'roleName',
      })
      mockGet.mockResolvedValueOnce({
        data: { data: { roles: [roleApiData] } },
      })

      const result = await tenantService.getUserRoles(
        toTenantId('t-1'),
        toUserId('u-1'),
      )

      expect(result).toHaveLength(1)
      expect(result[0].description).toBe('roleDescription')
      expect(result[0].id).toBe('roleId')
      expect(result[0].name).toBe('roleName')
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('User not found in tenant')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        tenantService.getUserRoles(toTenantId('t-1'), toUserId('u-1')),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant users roles',
        error,
      )
    })
  })

  describe('getUserTenants', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: {} } })

      await tenantService.getUserTenants(toSsoUserId('su-1'))

      expect(mockGet).toHaveBeenCalledWith(
        '/users/su-1/tenants?expand=tenantUserRoles',
      )
    })

    it('should correctly return data', async () => {
      const tenantApiData = makeTenantApiData({
        createdBy: 'tenantCreatedBy',
        createdDateTime: 'tenantCreatedDateTime',
        description: 'tenantDescription',
        id: toTenantId('tenantId'),
        ministryName: 'tenantMinistryName',
        name: 'tenantName',
        users: [makeUserApiData()],
      })
      mockGet.mockResolvedValueOnce({
        data: { data: { tenants: [tenantApiData] } },
      })

      const result = await tenantService.getUserTenants(toSsoUserId('su-1'))

      expect(result).toHaveLength(1)
      expect(result[0].createdBy).toBe('tenantCreatedBy')
      expect(result[0].createdDateTime).toBe('tenantCreatedDateTime')
      expect(result[0].description).toBe('tenantDescription')
      expect(result[0].id).toBe('tenantId')
      expect(result[0].ministryName).toBe('tenantMinistryName')
      expect(result[0].name).toBe('tenantName')
      expect(result[0].users).toHaveLength(1)
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('User not found')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        tenantService.getUserTenants(toSsoUserId('su-1')),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting users tenants',
        error,
      )
    })
  })

  describe('getUsers', () => {
    it('should correctly call the api', async () => {
      mockGet.mockResolvedValueOnce({ data: { data: {} } })

      await tenantService.getUsers(toTenantId('t-1'))

      expect(mockGet).toHaveBeenCalledWith('/tenants/t-1/users')
    })

    it('should correctly return data', async () => {
      const user = makeUserApiData({
        id: toUserId('userId'),
        ssoUser: makeSsoUserApiData({
          displayName: 'ssoUserDisplayName',
          email: 'ssoUserEmail',
          firstName: 'ssoUserFirstName',
          idpType: 'ssoUserIdpType',
          lastName: 'ssoUserLastName',
          ssoUserId: toSsoUserId('ssoUserId'),
          userName: 'ssoUserName',
        }),
      })
      mockGet.mockResolvedValueOnce({ data: { data: { users: [user] } } })

      const result = await tenantService.getUsers(toTenantId('t-1'))

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('userId')
      expect(result[0].ssoUser.displayName).toBe('ssoUserDisplayName')
      expect(result[0].ssoUser.email).toBe('ssoUserEmail')
      expect(result[0].ssoUser.firstName).toBe('ssoUserFirstName')
      expect(result[0].ssoUser.idpType).toBe('ssoUserIdpType')
      expect(result[0].ssoUser.lastName).toBe('ssoUserLastName')
      expect(result[0].ssoUser.ssoUserId).toBe('ssoUserId')
      expect(result[0].ssoUser.userName).toBe('ssoUserName')
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Tenant not found')
      mockGet.mockRejectedValueOnce(error)

      await expect(tenantService.getUsers(toTenantId('t-1'))).rejects.toThrow(
        error,
      )

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant users',
        error,
      )
    })
  })

  describe('removeUser', () => {
    it('should correctly call the api', async () => {
      mockDelete.mockResolvedValueOnce({})

      await tenantService.removeUser(toTenantId('t-1'), toUserId('u-1'))

      expect(mockDelete).toHaveBeenCalledWith('/tenants/t-1/users/u-1')
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { message: 'Tenant name already exists' },
          status: 409,
        },
      }
      mockDelete.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        tenantService.removeUser(toTenantId('t-1'), toUserId('u-1')),
      ).rejects.toBeInstanceOf(DuplicateEntityError)
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('User not found')
      mockDelete.mockRejectedValueOnce(error)

      await expect(
        tenantService.removeUser(toTenantId('t-1'), toUserId('u-1')),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error removing user from tenant',
        error,
      )
    })
  })

  describe('removeUserRole', () => {
    it('should correctly call the api', async () => {
      mockDelete.mockResolvedValueOnce({})

      await tenantService.removeUserRole(
        toTenantId('t-1'),
        toUserId('u-1'),
        toRoleId('r-1'),
      )

      expect(mockDelete).toHaveBeenCalledWith(
        '/tenants/t-1/users/u-1/roles/r-1',
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Role not found for user')
      mockDelete.mockRejectedValueOnce(error)

      await expect(
        tenantService.removeUserRole(
          toTenantId('t-1'),
          toUserId('u-1'),
          toRoleId('r-1'),
        ),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error removing user role from tenant',
        error,
      )
    })
  })

  describe('updateTenant', () => {
    it('should correctly call the api', async () => {
      mockPut.mockResolvedValueOnce({ data: { data: {} } })

      await tenantService.updateTenant(
        toTenantId('t-1'),
        'tenantName',
        'tenantMinistry',
        'tenantDescription',
      )

      expect(mockPut).toHaveBeenCalledWith('/tenants/t-1', {
        description: 'tenantDescription',
        ministryName: 'tenantMinistry',
        name: 'tenantName',
      })
    })

    it('should correctly return data', async () => {
      const tenantApiData = makeTenantApiData({
        createdBy: 'tenantCreatedBy',
        createdDateTime: 'tenantCreatedDateTime',
        description: 'tenantDescription',
        id: toTenantId('tenantId'),
        ministryName: 'tenantMinistryName',
        name: 'tenantName',
        users: [makeUserApiData()],
      })
      mockPut.mockResolvedValueOnce({
        data: { data: { tenant: tenantApiData } },
      })

      const result = await tenantService.updateTenant(
        toTenantId('t-1'),
        'tenantName',
        'tenantMinistryName',
        'tenantDescription',
      )

      expect(result.createdBy).toBe('tenantCreatedBy')
      expect(result.createdDateTime).toBe('tenantCreatedDateTime')
      expect(result.description).toBe('tenantDescription')
      expect(result.id).toBe('tenantId')
      expect(result.ministryName).toBe('tenantMinistryName')
      expect(result.name).toBe('tenantName')
      expect(result.users).toHaveLength(1)
    })

    it('should throw ValidationError on HTTP 400', async () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { details: { body: [{ message: 'Name cannot be empty' }] } },
          status: 400,
        },
      }
      mockPut.mockRejectedValueOnce(error)
      mockedUtils.isValidationError.mockReturnValueOnce(true)

      await expect(
        tenantService.updateTenant(
          toTenantId('t-1'),
          'tenantName',
          'tenantMinistryName',
          'tenantDescription',
        ),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const error = {
        isAxiosError: true,
        response: {
          data: { message: 'Tenant name already exists' },
          status: 409,
        },
      }
      mockPut.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        tenantService.updateTenant(
          toTenantId('t-1'),
          'tenantName',
          'tenantMinistryName',
          'tenantDescription',
        ),
      ).rejects.toBeInstanceOf(DuplicateEntityError)
    })

    it('should log and rethrow unknown errors', async () => {
      const genericError = new Error('Update failed')
      mockPut.mockRejectedValueOnce(genericError)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(false)
      mockedUtils.isValidationError.mockReturnValueOnce(false)

      await expect(
        tenantService.updateTenant(
          toTenantId('t-1'),
          'tenantName',
          'tenantMinistryName',
          'tenantDescription',
        ),
      ).rejects.toThrow(genericError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error updating tenant',
        genericError,
      )
    })
  })
})
