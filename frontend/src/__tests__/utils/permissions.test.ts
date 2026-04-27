import { describe, expect, it } from 'vitest'

import {
  makeRoleTenantOwner,
  makeTenant,
  makeUser,
  makeUserOperationsAdmin,
} from '@/__tests__/__factories__'
import { mockAuthStore } from '@/__tests__/__helpers__/useAuthStore.mock'

import { ROLES } from '@/utils/constants'
import {
  currentUserHasRole,
  currentUserIsOperationsAdmin,
} from '@/utils/permissions'

describe('currentUserHasRole', () => {
  it('returns true when the current user has the specified role in the tenant', () => {
    const user = makeUser({
      ssoUserId: 'user-123',
      roles: [makeRoleTenantOwner()],
    })
    mockAuthStore(user)
    const tenant = makeTenant({ users: [user] })

    expect(currentUserHasRole(tenant, ROLES.TENANT_OWNER.value)).toBe(true)
  })

  it('returns false when the current user does not have the specified role', () => {
    const user = makeUser({ ssoUserId: 'user-123', roles: [] })
    mockAuthStore(user)
    const tenant = makeTenant({ users: [user] })

    expect(currentUserHasRole(tenant, ROLES.TENANT_OWNER.value)).toBe(false)
  })

  it('returns false when the current user is not in the tenant', () => {
    const user = makeUser({ ssoUserId: 'user-123' })
    const otherUser = makeUser({ ssoUserId: 'other-user' })
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
