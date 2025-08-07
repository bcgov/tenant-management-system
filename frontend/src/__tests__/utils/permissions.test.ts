import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  currentUserHasRole,
  currentUserIsOperationsAdmin,
} from '@/utils/permissions'
import { Tenant, User, SsoUser } from '@/models'

// Mock the auth store
const mockAuthStore = {
  authenticatedUser: null as User | null | undefined,
  isOperationsAdmin: false,
}

vi.mock('@/stores', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Mock tenant model
const mockTenant = {
  userHasRole: vi.fn(),
} as unknown as Tenant

describe('User Permissions Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.authenticatedUser = null
    mockAuthStore.isOperationsAdmin = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('currentUserHasRole', () => {
    it('should return false when no user is authenticated', () => {
      mockAuthStore.authenticatedUser = null

      const result = currentUserHasRole(mockTenant, 'ADMIN')

      expect(result).toBe(false)
      expect(mockTenant.userHasRole).not.toHaveBeenCalled()
    })

    it('should return false when user is undefined', () => {
      mockAuthStore.authenticatedUser = undefined

      const result = currentUserHasRole(mockTenant, 'ADMIN')

      expect(result).toBe(false)
      expect(mockTenant.userHasRole).not.toHaveBeenCalled()
    })

    it('should call tenant.userHasRole with current user and role name', () => {
      const mockSsoUser = new SsoUser(
        '123',
        'john.doe',
        'John',
        'Doe',
        'John Doe',
        'john.doe@example.com',
      )
      const mockUser = new User('123', mockSsoUser, [])
      mockAuthStore.authenticatedUser = mockUser
      vi.mocked(mockTenant.userHasRole).mockReturnValue(true)

      const result = currentUserHasRole(mockTenant, 'ADMIN')

      expect(mockTenant.userHasRole).toHaveBeenCalledWith(mockUser, 'ADMIN')
      expect(mockTenant.userHasRole).toHaveBeenCalledTimes(1)
      expect(result).toBe(true)
    })

    it('should return false when tenant.userHasRole returns false', () => {
      const mockSsoUser = new SsoUser(
        '123',
        'john.doe',
        'John',
        'Doe',
        'John Doe',
        'john.doe@example.com',
      )
      const mockUser = new User('123', mockSsoUser, [])
      mockAuthStore.authenticatedUser = mockUser
      vi.mocked(mockTenant.userHasRole).mockReturnValue(false)

      const result = currentUserHasRole(mockTenant, 'ADMIN')

      expect(mockTenant.userHasRole).toHaveBeenCalledWith(mockUser, 'ADMIN')
      expect(result).toBe(false)
    })

    it('should work with different role names', () => {
      const mockSsoUser = new SsoUser(
        '456',
        'jane.smith',
        'Jane',
        'Smith',
        'Jane Smith',
        'jane.smith@example.com',
      )
      const mockUser = new User('456', mockSsoUser, [])
      mockAuthStore.authenticatedUser = mockUser
      vi.mocked(mockTenant.userHasRole).mockReturnValue(true)

      const roles = ['USER_ADMIN', 'SERVICE_USER', 'TENANT_OWNER']

      roles.forEach((role) => {
        const result = currentUserHasRole(mockTenant, role)
        expect(result).toBe(true)
      })

      expect(mockTenant.userHasRole).toHaveBeenCalledTimes(roles.length)
      roles.forEach((role) => {
        expect(mockTenant.userHasRole).toHaveBeenCalledWith(mockUser, role)
      })
    })

    it('should handle empty role name', () => {
      const mockSsoUser = new SsoUser(
        '789',
        'bob.wilson',
        'Bob',
        'Wilson',
        'Bob Wilson',
        'bob.wilson@example.com',
      )
      const mockUser = new User('789', mockSsoUser, [])
      mockAuthStore.authenticatedUser = mockUser
      vi.mocked(mockTenant.userHasRole).mockReturnValue(false)

      const result = currentUserHasRole(mockTenant, '')

      expect(mockTenant.userHasRole).toHaveBeenCalledWith(mockUser, '')
      expect(result).toBe(false)
    })
  })

  describe('currentUserIsOperationsAdmin', () => {
    it('should return false when user is not operations admin', () => {
      mockAuthStore.isOperationsAdmin = false

      const result = currentUserIsOperationsAdmin()

      expect(result).toBe(false)
    })

    it('should return true when user is operations admin', () => {
      mockAuthStore.isOperationsAdmin = true

      const result = currentUserIsOperationsAdmin()

      expect(result).toBe(true)
    })

    it('should directly return auth store value', () => {
      // Test that it's not doing any additional logic
      const testValues = [true, false, true, false]

      testValues.forEach((value) => {
        mockAuthStore.isOperationsAdmin = value
        const result = currentUserIsOperationsAdmin()
        expect(result).toBe(value)
      })
    })
  })

  describe('integration scenarios', () => {
    it('should handle operations admin checking role in tenant', () => {
      const mockSsoUser = new SsoUser(
        '999',
        'admin.user',
        'Admin',
        'User',
        'Admin User',
        'admin.user@example.com',
      )
      const mockUser = new User('999', mockSsoUser, [])
      mockAuthStore.authenticatedUser = mockUser
      mockAuthStore.isOperationsAdmin = true
      vi.mocked(mockTenant.userHasRole).mockReturnValue(true)

      const isOpsAdmin = currentUserIsOperationsAdmin()
      const hasRole = currentUserHasRole(mockTenant, 'USER_ADMIN')

      expect(isOpsAdmin).toBe(true)
      expect(hasRole).toBe(true)
      expect(mockTenant.userHasRole).toHaveBeenCalledWith(
        mockUser,
        'USER_ADMIN',
      )
    })

    it('should handle non-operations admin with no tenant role', () => {
      const mockSsoUser = new SsoUser(
        '888',
        'regular.user',
        'Regular',
        'User',
        'Regular User',
        'regular.user@example.com',
      )
      const mockUser = new User('888', mockSsoUser, [])
      mockAuthStore.authenticatedUser = mockUser
      mockAuthStore.isOperationsAdmin = false
      vi.mocked(mockTenant.userHasRole).mockReturnValue(false)

      const isOpsAdmin = currentUserIsOperationsAdmin()
      const hasRole = currentUserHasRole(mockTenant, 'ADMIN')

      expect(isOpsAdmin).toBe(false)
      expect(hasRole).toBe(false)
    })

    it('should handle unauthenticated user for both functions', () => {
      mockAuthStore.authenticatedUser = null
      mockAuthStore.isOperationsAdmin = false

      const isOpsAdmin = currentUserIsOperationsAdmin()
      const hasRole = currentUserHasRole(mockTenant, 'USER')

      expect(isOpsAdmin).toBe(false)
      expect(hasRole).toBe(false)
      expect(mockTenant.userHasRole).not.toHaveBeenCalled()
    })
  })
})
