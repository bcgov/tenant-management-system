import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  makeRoleTenantOwner,
  makeSsoUser,
  makeTenant,
  makeUser,
  makeUserBceid,
  makeUserIdir,
  makeUserOperationsAdmin,
} from '@/__tests__/__factories__'
import { createMockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import { ROLES } from '@/utils/constants'
import {
  currentUserHasRole,
  currentUserIsBceid,
  currentUserIsIdir,
  currentUserIsOperationsAdmin,
} from '@/utils/permissions'

let currentAuthStore = createMockAuthStore()

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => currentAuthStore,
}))

beforeEach(() => {
  vi.clearAllMocks()
  currentAuthStore = createMockAuthStore()
})

describe('permissions', () => {
  describe('currentUserHasRole', () => {
    it('returns true when the current user has the specified role in the tenant', () => {
      const user = makeUser({
        roles: [makeRoleTenantOwner()],
      })
      currentAuthStore = createMockAuthStore({ user })
      const tenant = makeTenant({ users: [user] })

      expect(currentUserHasRole(tenant, ROLES.TENANT_OWNER.value)).toBe(true)
    })

    it('returns false when the current user does not have the specified role', () => {
      const user = makeUser({ roles: [] })
      currentAuthStore = createMockAuthStore({ user })
      const tenant = makeTenant({ users: [user] })

      expect(currentUserHasRole(tenant, ROLES.TENANT_OWNER.value)).toBe(false)
    })

    it('returns false when the current user is not in the tenant', () => {
      const user = makeUser()
      const otherUser = makeUser({
        ssoUser: makeSsoUser({ ssoUserId: 'other-user' }),
      })
      currentAuthStore = createMockAuthStore({ user })
      const tenant = makeTenant({ users: [otherUser] })

      expect(currentUserHasRole(tenant, ROLES.TENANT_OWNER.value)).toBe(false)
    })

    it('returns false when the user is not authenticated', () => {
      currentAuthStore = createMockAuthStore({ user: null })
      const tenant = makeTenant()

      expect(currentUserHasRole(tenant, ROLES.TENANT_OWNER.value)).toBe(false)
    })
  })

  describe('currentUserIsBCeID', () => {
    it('returns true when the current user is BCeID', () => {
      currentAuthStore = createMockAuthStore({ user: makeUserBceid() })

      expect(currentUserIsBceid()).toBe(true)
    })

    it('returns false when the current user is IDIR', () => {
      currentAuthStore = createMockAuthStore({ user: makeUserIdir() })

      expect(currentUserIsBceid()).toBe(false)
    })

    it('returns false when no current user', () => {
      currentAuthStore = createMockAuthStore({ user: null })

      expect(currentUserIsBceid()).toBe(false)
    })
  })

  describe('currentUserIsIDIR', () => {
    it('returns true when the current user is IDIR', () => {
      currentAuthStore = createMockAuthStore({ user: makeUserIdir() })

      expect(currentUserIsIdir()).toBe(true)
    })

    it('returns false when the current user is IDIR', () => {
      currentAuthStore = createMockAuthStore({ user: makeUserBceid() })

      expect(currentUserIsIdir()).toBe(false)
    })

    it('returns false when no current user', () => {
      currentAuthStore = createMockAuthStore({ user: null })

      expect(currentUserIsIdir()).toBe(false)
    })
  })

  describe('currentUserIsOperationsAdmin', () => {
    it('returns true when the current user is an operations admin', () => {
      currentAuthStore = createMockAuthStore({
        user: makeUserOperationsAdmin(),
      })

      expect(currentUserIsOperationsAdmin()).toBe(true)
    })

    it('returns false when the current user does not have the operations admin role', () => {
      currentAuthStore = createMockAuthStore({ user: makeUser() })

      expect(currentUserIsOperationsAdmin()).toBe(false)
    })

    it('returns false when the user is not authenticated', () => {
      currentAuthStore = createMockAuthStore({ user: null })

      expect(currentUserIsOperationsAdmin()).toBe(false)
    })
  })
})
