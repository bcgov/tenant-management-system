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
import { User } from '@/models'
import { tenantService } from '@/services/tenant.service'

describe('tenantService', () => {
  const tenantId = '1'
  const userId = '123'
  const roleId = '456'
  const ssoUserId = '789'

  const fakeRole = {
    id: roleId,
    name: 'Admin',
    description: 'Administrator role',
  }

  const fakeUser: User = {
    id: userId,
    roles: [fakeRole],
    ssoUser: {
      displayName: 'John Doe',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      ssoUserId: ssoUserId,
      userName: 'johndoe',
    },
  }

  const fakeTenant = {
    id: tenantId,
    name: 'Test Tenant',
    ministryName: 'Test Ministry',
    description: 'Test tenant description',
  }

  const fakeUserResponse = {
    id: userId,
    ...fakeUser.ssoUser,
    roles: [fakeRole],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('addUser', () => {
    it('should return the added user on success', async () => {
      mockPost.mockResolvedValueOnce({
        data: { data: { user: fakeUserResponse } },
      })

      const result = await tenantService.addUser(tenantId, fakeUser)

      expect(result).toEqual(fakeUserResponse)
      expect(mockPost).toHaveBeenCalledWith(`/tenants/${tenantId}/users`, {
        roles: [roleId],
        user: {
          displayName: fakeUser.ssoUser.displayName,
          email: fakeUser.ssoUser.email,
          firstName: fakeUser.ssoUser.firstName,
          lastName: fakeUser.ssoUser.lastName,
          ssoUserId: fakeUser.ssoUser.ssoUserId,
          userName: fakeUser.ssoUser.userName,
        },
      })
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 409,
          data: { message: 'User already exists in tenant' },
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        tenantService.addUser(tenantId, fakeUser),
      ).rejects.toBeInstanceOf(DuplicateEntityError)
    })

    it('should log and rethrow unknown errors', async () => {
      const genericError = new Error('Something went wrong')
      mockPost.mockRejectedValueOnce(genericError)

      await expect(tenantService.addUser(tenantId, fakeUser)).rejects.toThrow(
        genericError,
      )

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error adding user to tenant',
        genericError,
      )
    })
  })

  describe('assignUserRoles', () => {
    it('should successfully assign role to user', async () => {
      mockPut.mockResolvedValueOnce({})

      await tenantService.assignUserRoles(tenantId, userId, [roleId])
      expect(mockPut).toHaveBeenCalledWith(
        `/tenants/${tenantId}/users/${userId}/roles`,
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to assign role')
      mockPut.mockRejectedValueOnce(error)

      await expect(
        tenantService.assignUserRoles(tenantId, userId, [roleId]),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error assigning user role in tenant',
        error,
      )
    })
  })

  describe('createTenant', () => {
    const tenantName = 'New Tenant'
    const ministryName = 'New Ministry'

    it('should return the created tenant on success', async () => {
      const newTenant = { ...fakeTenant, name: tenantName, ministryName }
      mockPost.mockResolvedValueOnce({ data: { data: { tenant: newTenant } } })

      const result = await tenantService.createTenant(
        tenantName,
        ministryName,
        fakeUser,
      )

      expect(result).toEqual(newTenant)
      expect(mockPost).toHaveBeenCalledWith('/tenants', {
        ministryName,
        name: tenantName,
        user: {
          displayName: fakeUser.ssoUser.displayName,
          email: fakeUser.ssoUser.email,
          firstName: fakeUser.ssoUser.firstName,
          lastName: fakeUser.ssoUser.lastName,
          ssoUserId: fakeUser.ssoUser.ssoUserId,
          userName: fakeUser.ssoUser.userName,
        },
      })
    })

    it('should throw ValidationError on HTTP 400', async () => {
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
        tenantService.createTenant(tenantName, ministryName, fakeUser),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 409,
          data: { message: 'Tenant already exists' },
        },
      }
      mockPost.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        tenantService.createTenant(tenantName, ministryName, fakeUser),
      ).rejects.toBeInstanceOf(DuplicateEntityError)
    })

    it('should log and rethrow unknown errors', async () => {
      const genericError = new Error('Database error')
      mockPost.mockRejectedValueOnce(genericError)

      await expect(
        tenantService.createTenant(tenantName, ministryName, fakeUser),
      ).rejects.toThrow(genericError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error creating tenant',
        genericError,
      )
    })
  })

  describe('getTenant', () => {
    it('should return the tenant with expanded user roles on success', async () => {
      const tenantWithRoles = {
        ...fakeTenant,
        tenantUserRoles: [{ userId, roleId }],
      }
      mockGet.mockResolvedValueOnce({
        data: { data: { tenant: tenantWithRoles } },
      })

      const result = await tenantService.getTenant(tenantId)

      expect(result).toEqual(tenantWithRoles)
      expect(mockGet).toHaveBeenCalledWith(
        `/tenants/${tenantId}?expand=tenantUserRoles`,
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Tenant not found')
      mockGet.mockRejectedValueOnce(error)

      await expect(tenantService.getTenant(tenantId)).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant',
        error,
      )
    })
  })

  describe('getTenantRoles', () => {
    it('should return all tenant roles on success', async () => {
      const roles = [
        fakeRole,
        { id: '457', name: 'User', description: 'User role' },
      ]
      mockGet.mockResolvedValueOnce({ data: { data: { roles } } })

      const result = await tenantService.getTenantRoles(tenantId)

      expect(result).toEqual(roles)
      expect(mockGet).toHaveBeenCalledWith(`/tenants/${tenantId}/roles`)
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Failed to fetch roles')
      mockGet.mockRejectedValueOnce(error)

      await expect(tenantService.getTenantRoles(tenantId)).rejects.toThrow(
        error,
      )

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant roles',
        error,
      )
    })
  })

  describe('getUserRoles', () => {
    it('should return user roles within tenant on success', async () => {
      const userRoles = [fakeRole]
      mockGet.mockResolvedValueOnce({ data: { data: { roles: userRoles } } })

      const result = await tenantService.getUserRoles(tenantId, userId)

      expect(result).toEqual(userRoles)
      expect(mockGet).toHaveBeenCalledWith(
        `/tenants/${tenantId}/users/${userId}/roles`,
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('User not found in tenant')
      mockGet.mockRejectedValueOnce(error)

      await expect(
        tenantService.getUserRoles(tenantId, userId),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant users roles',
        error,
      )
    })
  })

  describe('getUserTenants', () => {
    it('should return user tenants with expanded roles on success', async () => {
      const userTenants = [
        { ...fakeTenant, tenantUserRoles: [{ userId, roleId }] },
        { id: '2', name: 'Another Tenant', ministryName: 'Another Ministry' },
      ]
      mockGet.mockResolvedValueOnce({
        data: { data: { tenants: userTenants } },
      })

      const result = await tenantService.getUserTenants(ssoUserId)

      expect(result).toEqual(userTenants)
      expect(mockGet).toHaveBeenCalledWith(
        `/users/${ssoUserId}/tenants?expand=tenantUserRoles`,
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('User not found')
      mockGet.mockRejectedValueOnce(error)

      await expect(tenantService.getUserTenants(ssoUserId)).rejects.toThrow(
        error,
      )

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting users tenants',
        error,
      )
    })
  })

  describe('getUsers', () => {
    it('should return all tenant users on success', async () => {
      const users = [
        fakeUserResponse,
        { id: '124', displayName: 'Jane Smith', email: 'jane@example.com' },
      ]
      mockGet.mockResolvedValueOnce({ data: { data: { users } } })

      const result = await tenantService.getUsers(tenantId)

      expect(result).toEqual(users)
      expect(mockGet).toHaveBeenCalledWith(`/tenants/${tenantId}/users`)
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Tenant not found')
      mockGet.mockRejectedValueOnce(error)

      await expect(tenantService.getUsers(tenantId)).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error getting tenant users',
        error,
      )
    })
  })

  describe('removeUserRole', () => {
    it('should successfully remove role from user', async () => {
      mockDelete.mockResolvedValueOnce({})

      await tenantService.removeUserRole(tenantId, userId, roleId)

      expect(mockDelete).toHaveBeenCalledWith(
        `/tenants/${tenantId}/users/${userId}/roles/${roleId}`,
      )
    })

    it('should log and rethrow errors', async () => {
      const error = new Error('Role not found for user')
      mockDelete.mockRejectedValueOnce(error)

      await expect(
        tenantService.removeUserRole(tenantId, userId, roleId),
      ).rejects.toThrow(error)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error removing user role from tenant',
        error,
      )
    })
  })

  describe('updateTenant', () => {
    const updatedName = 'Updated Tenant'
    const updatedMinistry = 'Updated Ministry'
    const updatedDescription = 'Updated description'

    it('should return the updated tenant on success', async () => {
      const updatedTenant = {
        ...fakeTenant,
        name: updatedName,
        ministryName: updatedMinistry,
        description: updatedDescription,
      }
      mockPut.mockResolvedValueOnce({
        data: { data: { tenant: updatedTenant } },
      })

      const result = await tenantService.updateTenant(
        tenantId,
        updatedName,
        updatedMinistry,
        updatedDescription,
      )

      expect(result).toEqual(updatedTenant)
      expect(mockPut).toHaveBeenCalledWith(`/tenants/${tenantId}`, {
        name: updatedName,
        ministryName: updatedMinistry,
        description: updatedDescription,
      })
    })

    it('should throw ValidationError on HTTP 400', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { details: { body: [{ message: 'Name cannot be empty' }] } },
        },
      }
      mockPut.mockRejectedValueOnce(error)
      mockedUtils.isValidationError.mockReturnValueOnce(true)

      await expect(
        tenantService.updateTenant(
          tenantId,
          updatedName,
          updatedMinistry,
          updatedDescription,
        ),
      ).rejects.toBeInstanceOf(ValidationError)
    })

    it('should throw DuplicateEntityError on HTTP 409', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 409,
          data: { message: 'Tenant name already exists' },
        },
      }
      mockPut.mockRejectedValueOnce(error)
      mockedUtils.isDuplicateEntityError.mockReturnValueOnce(true)

      await expect(
        tenantService.updateTenant(
          tenantId,
          updatedName,
          updatedMinistry,
          updatedDescription,
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
          tenantId,
          updatedName,
          updatedMinistry,
          updatedDescription,
        ),
      ).rejects.toThrow(genericError)

      expect(mockedUtils.logApiError).toHaveBeenCalledWith(
        'Error updating tenant',
        genericError,
      )
    })
  })
})
