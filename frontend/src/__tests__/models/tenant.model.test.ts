import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { makeRole, makeSsoUser, makeUser } from '@/__tests__/__factories__'

import { Role, toRoleId } from '@/models/role.model'
import { SsoUser, toSsoUserId } from '@/models/ssouser.model'
import {
  Tenant,
  type TenantApiData,
  type TenantId,
  toTenantId,
} from '@/models/tenant.model'
import { toUserId, User, type UserId } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

describe('Tenant model', () => {
  beforeEach(() => {
    vi.spyOn(User, 'fromApiData').mockImplementation(
      (apiData: { id: string; ssoUser: SsoUser; roles?: Role[] }) =>
        new User(toUserId(apiData.id), apiData.ssoUser, apiData.roles ?? []),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('constructor assigns properties correctly', () => {
    const users = [
      makeUser({
        id: 'user1',
      }),
      makeUser({
        id: 'user2',
      }),
    ]

    const tenant = new Tenant(
      'creatorUser',
      '2025-08-01',
      'Tenant description',
      toTenantId('tenant123'),
      'Tenant Name',
      'Ministry',
      users,
    )

    expect(tenant.users).toEqual(users)
  })

  it('constructor sets users to empty array if not an array', () => {
    const tenant = new Tenant(
      'creatorUser',
      '2025-08-01',
      'Tenant description',
      toTenantId('tenant123'),
      'Tenant Name',
      'Ministry',
      null as unknown as User[],
    )

    expect(tenant.users).toEqual([])
  })

  it('fromApiData converts API data to Tenant instance correctly', () => {
    const apiData: TenantApiData = {
      createdBy: 'creatorUser',
      createdDateTime: '2025-08-01',
      description: 'API description',
      id: 'tenant456' as TenantId,
      ministryName: 'Ministry',
      name: 'API Tenant',
      users: [
        {
          id: 'userA' as UserId,
          ssoUser: {
            displayName: 'DisplayA',
            email: 'a@example.com',
            firstName: 'FirstA',
            lastName: 'LastA',
            ssoUserId: toSsoUserId('ssoA'),
            userName: 'userA',
          },
          roles: [
            {
              description: 'Owner role',
              id: toRoleId('r1'),
              name: ROLES.TENANT_OWNER.value,
            },
          ],
        },
        {
          id: 'userB' as UserId,
          ssoUser: {
            displayName: 'DisplayB',
            email: 'b@example.com',
            firstName: 'FirstB',
            lastName: 'LastB',
            ssoUserId: toSsoUserId('ssoB'),
            userName: 'userB',
          },
          roles: [
            {
              description: 'Other role',
              id: toRoleId('r2'),
              name: 'SomeRole',
            },
          ],
        },
      ],
    }

    const tenant = Tenant.fromApiData(apiData)

    expect(User.fromApiData).toHaveBeenCalledTimes(apiData.users.length)
    expect(tenant.users).toHaveLength(apiData.users.length)
  })

  it('fromApiData handles created by display name', () => {
    const apiData = {
      createdBy: 'created-by-uuid',
      createdByDisplayName: 'created-by-display-name',
      createdDateTime: '2025-08-01',
      description: 'API description',
      id: 'tenant456' as TenantId,
      ministryName: 'Ministry',
      name: 'API Tenant',
      users: [],
    }

    const tenant = Tenant.fromApiData(apiData)

    expect(tenant.createdBy).toBe('created-by-display-name')
  })

  it('fromApiData handles null users gracefully', () => {
    type TenantApiData = Omit<
      Parameters<typeof Tenant.fromApiData>[0],
      'users'
    > & {
      users: User[] | null
    }

    const apiData: TenantApiData = {
      createdBy: 'creatorUser',
      createdDateTime: '2025-08-01',
      description: 'API description',
      id: toTenantId('tenant789'),
      ministryName: 'Ministry',
      name: 'API Tenant',
      users: null,
    }

    // Cast to expected param type to simulate invalid input with nullable users
    const tenant = Tenant.fromApiData(
      apiData as unknown as Parameters<typeof Tenant.fromApiData>[0],
    )

    expect(tenant.users).toEqual([])
  })

  it('findUser returns the user matching the ssoUserId', () => {
    const ssoUserId = toSsoUserId('sso1')
    const user = makeUser({ ssoUser: makeSsoUser({ ssoUserId }) })

    const tenant = new Tenant(
      'creatorUser',
      '2025-08-01',
      '',
      toTenantId('tenant1'),
      'Name',
      'Ministry',
      [user],
    )

    expect(tenant.findUser(ssoUserId)).toEqual(user)
    expect(tenant.findUser(toSsoUserId('not-found'))).toBeUndefined()
  })

  it('getOwners returns users with TENANT_OWNER role', () => {
    const ownerRole = makeRole({
      description: 'Owner role',
      id: 'r1',
      name: ROLES.TENANT_OWNER.value,
    })
    const otherRole = makeRole({
      description: 'Other role',
      id: 'r2',
      name: 'SomeOtherRole',
    })
    const ownerUser = makeUser({
      roles: [ownerRole],
      ssoUser: makeSsoUser({ ssoUserId: toSsoUserId('sso1') }),
    })
    const otherUser = makeUser({
      roles: [otherRole],
      ssoUser: makeSsoUser({ ssoUserId: toSsoUserId('sso2') }),
    })

    const tenant = new Tenant(
      'creatorUser',
      '2025-08-01',
      '',
      toTenantId('tenant1'),
      'Name',
      'Ministry',
      [ownerUser, otherUser],
    )

    expect(tenant.getOwners()).toEqual([ownerUser])
    expect(tenant.getFirstOwner()).toEqual(ownerUser)
  })
})

it('userHasRole returns true if user has the role', () => {
  const roleName = ROLES.TENANT_OWNER.value
  const user = makeUser({
    roles: [makeRole({ description: 'Owner role', id: 'r1', name: roleName })],
  })
  const tenant = new Tenant(
    'creatorUser',
    '2025-08-01',
    '',
    toTenantId('tenant1'),
    'Name',
    'Ministry',
    [user],
  )

  expect(tenant.userHasRole(user, roleName)).toBe(true)
  expect(tenant.userHasRole(user, 'NonexistentRole')).toBe(false)
})

it('userHasRole returns false if user does not have the role or is not found', () => {
  const roleName = ROLES.TENANT_OWNER.value
  const user = makeUser({
    roles: [
      makeRole({ description: 'Other role', id: 'r1', name: 'SomeOtherRole' }),
    ],
  })
  const tenant = new Tenant(
    'creatorUser',
    '2025-08-01',
    'Description',
    toTenantId('tenant1'),
    'Name',
    'Ministry',
    [user],
  )

  // User exists but does not have the role
  expect(tenant.userHasRole(user, roleName)).toBe(false)

  // User not found in tenant users
  const unknownUser = makeUser({
    id: 'otherUser',
    roles: [
      makeRole({ description: 'Other role', id: 'r2', name: 'SomeOtherRole' }),
    ],
  })

  expect(tenant.userHasRole(unknownUser, roleName)).toBe(false)
})
