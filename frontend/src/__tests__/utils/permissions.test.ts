import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SsoUser } from '@/models/ssouser.model'
import { Tenant } from '@/models/tenant.model'
import { User } from '@/models/user.model'
import { Role } from '@/models/role.model'
import { ROLES } from '@/utils/constants'
import {
  currentUserHasRole,
  currentUserIsOperationsAdmin,
} from '@/utils/permissions'

const mockStore = {
  authenticatedUser: null as User | null,
}

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => mockStore,
}))

const mockTenant = {
  userHasRole: vi.fn(),
} as unknown as Tenant

describe('User Permissions Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.authenticatedUser = null
  })

  const createMockUser = (roles: string[] = []) => {
    const sso = new SsoUser('123', 'jdoe', 'John', 'Doe', 'John Doe', 'j@b.com')
    const roleModels = roles.map((r) => new Role('id', r, r))
    return new User('123', sso, roleModels)
  }

  describe('currentUserHasRole', () => {
    it('should return false when no user is authenticated', () => {
      const result = currentUserHasRole(mockTenant, 'ADMIN')
      expect(result).toBe(false)
      expect(mockTenant.userHasRole).not.toHaveBeenCalled()
    })

    it('should delegate to tenant.userHasRole when user exists', () => {
      const user = createMockUser()
      mockStore.authenticatedUser = user
      vi.mocked(mockTenant.userHasRole).mockReturnValue(true)

      const result = currentUserHasRole(mockTenant, 'ADMIN')

      expect(mockTenant.userHasRole).toHaveBeenCalledWith(user, 'ADMIN')
      expect(result).toBe(true)
    })
  })

  describe('currentUserIsOperationsAdmin', () => {
    it('should return false if no user exists', () => {
      expect(currentUserIsOperationsAdmin()).toBe(false)
    })

    it('should return true if user has the admin role', () => {
      mockStore.authenticatedUser = createMockUser([
        ROLES.OPERATIONS_ADMIN.value,
      ])
      expect(currentUserIsOperationsAdmin()).toBe(true)
    })

    it('should return false if user lacks the admin role', () => {
      mockStore.authenticatedUser = createMockUser(['OTHER_ROLE'])
      expect(currentUserIsOperationsAdmin()).toBe(false)
    })
  })
})
