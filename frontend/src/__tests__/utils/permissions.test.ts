import { describe, expect, it } from 'vitest'

import {
  makeRoleTenantOwner,
  makeSsoUser,
  makeTenant,
  makeUser,
  makeUserBceid,
  makeUserIdir,
  makeUserOperationsAdmin,
} from '@/__tests__/__factories__'
import { mockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import { ROLES } from '@/utils/constants'
import {
  currentUserHasRole,
  currentUserIsBceid,
  currentUserIsIdir,
  currentUserIsOperationsAdmin,
} from '@/utils/permissions'

describe('permissions', () => {
  describe('currentUserHasRole', () => {
    it('returns true when the current user has the specified role in the tenant', () => {
      const user = makeUser({
        roles: [makeRoleTenantOwner()],
      })
      mockAuthStore(user)
      const tenant = makeTenant({ users: [user] })

      expect(currentUserHasRole(tenant, ROLES.TENANT_OWNER.value)).toBe(true)
    })

    it('returns false when the current user does not have the specified role', () => {
      const user = makeUser({ roles: [] })
      mockAuthStore(user)
      const tenant = makeTenant({ users: [user] })

      expect(currentUserHasRole(tenant, ROLES.TENANT_OWNER.value)).toBe(false)
    })

    it('returns false when the current user is not in the tenant', () => {
      const user = makeUser()
      const otherUser = makeUser({
        ssoUser: makeSsoUser({ ssoUserId: 'other-user' }),
      })
      mockAuthStore(user)
      const tenant = makeTenant({ users: [otherUser] })

      expect(currentUserHasRole(tenant, ROLES.TENANT_OWNER.value)).toBe(false)
    })

    it('returns false when the user is not authenticated', () => {
      mockAuthStore(null)
      const tenant = makeTenant()

      expect(currentUserHasRole(tenant, ROLES.TENANT_OWNER.value)).toBe(false)
    })
  })

  describe('currentUserIsBCeID', () => {
    it('returns true when the current user is BCeID', () => {
      mockAuthStore(makeUserBceid())

      expect(currentUserIsBceid()).toBe(true)
    })

    it('returns false when the current user is IDIR', () => {
      mockAuthStore(makeUserIdir())

      expect(currentUserIsBceid()).toBe(false)
    })

    it('returns false when no current user', () => {
      mockAuthStore(null)

      expect(currentUserIsBceid()).toBe(false)
    })
  })

  describe('currentUserIsIDIR', () => {
    it('returns true when the current user is IDIR', () => {
      mockAuthStore(makeUserIdir())

      expect(currentUserIsIdir()).toBe(true)
    })

    it('returns false when the current user is IDIR', () => {
      mockAuthStore(makeUserBceid())

      expect(currentUserIsIdir()).toBe(false)
    })

    it('returns false when no current user', () => {
      mockAuthStore(null)

      expect(currentUserIsIdir()).toBe(false)
    })
  })

  describe('currentUserIsOperationsAdmin', () => {
    it('returns true when the current user is an operations admin', () => {
      mockAuthStore(makeUserOperationsAdmin())

      expect(currentUserIsOperationsAdmin()).toBe(true)
    })

    it('returns false when the current user does not have the operations admin role', () => {
      mockAuthStore(makeUser())

      expect(currentUserIsOperationsAdmin()).toBe(false)
    })

    it('returns false when the user is not authenticated', () => {
      mockAuthStore(null)

      expect(currentUserIsOperationsAdmin()).toBe(false)
    })
  })
})
