import { describe, expect, it } from 'vitest'

import {
  makeRole,
  makeSsoUser,
  makeTenant,
  makeUser,
} from '@/__tests__/__factories__'

import { toRoleId } from '@/models/role.model'
import { toSsoUserId } from '@/models/ssouser.model'
import { Tenant, toTenantId } from '@/models/tenant.model'
import { toUserId } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

describe('Tenant model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const user = makeUser()
      const tenant = new Tenant({
        createdBy: 'createdBy',
        createdDate: 'createdDate',
        description: 'description',
        id: toTenantId('id'),
        ministryName: 'ministryName',
        name: 'name',
        users: [user],
      })

      expect(tenant.createdBy).toBe('createdBy')
      expect(tenant.createdDate).toBe('createdDate')
      expect(tenant.description).toBe('description')
      expect(tenant.id).toBe('id')
      expect(tenant.ministryName).toBe('ministryName')
      expect(tenant.name).toBe('name')
      expect(tenant.users).toHaveLength(1)
      expect(tenant.users[0]).toBe(user)
    })
  })

  describe('findUser', () => {
    it('returns the matching user', () => {
      const ssoUserId = toSsoUserId('sso1')
      const user = makeUser({ ssoUser: makeSsoUser({ ssoUserId: ssoUserId }) })
      const tenant = makeTenant({ users: [user] })

      expect(tenant.findUser(ssoUserId)).toEqual(user)
    })

    it('returns not defined when not found', () => {
      const ssoUserId = toSsoUserId('sso1')
      const user = makeUser({ ssoUser: makeSsoUser({ ssoUserId: ssoUserId }) })
      const tenant = makeTenant({ users: [user] })

      expect(tenant.findUser(toSsoUserId('not-found'))).toBeUndefined()
    })
  })

  describe('getOwners', () => {
    it('returns users with TENANT_OWNER role', () => {
      const ownerRole = makeRole({
        description: 'Owner role',
        id: toRoleId('r1'),
        name: ROLES.TENANT_OWNER.value,
      })
      const otherRole = makeRole({
        description: 'Other role',
        id: toRoleId('r2'),
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
      const tenant = makeTenant({ users: [ownerUser, otherUser] })

      expect(tenant.getOwners()).toEqual([ownerUser])
    })
  })

  describe('userHasRole', () => {
    it('returns true if user has role', () => {
      const roleName = ROLES.TENANT_OWNER.value
      const user = makeUser({
        roles: [
          makeRole({
            description: 'Owner role',
            id: toRoleId('r1'),
            name: roleName,
          }),
        ],
      })
      const tenant = makeTenant({ users: [user] })

      expect(tenant.userHasRole(user, roleName)).toBe(true)
    })

    it('returns false if user does not have role', () => {
      const roleName = ROLES.TENANT_OWNER.value
      const user = makeUser({
        roles: [
          makeRole({
            description: 'Owner role',
            id: toRoleId('r1'),
            name: roleName,
          }),
        ],
      })
      const tenant = makeTenant({ users: [user] })

      expect(tenant.userHasRole(user, 'NonexistentRole')).toBe(false)
    })

    it('returns false if user has role but is not in tenant', () => {
      const roleName = ROLES.TENANT_OWNER.value
      const role = makeRole({
        description: 'Other role',
        id: toRoleId('r1'),
        name: 'OtherRole',
      })
      const user = makeUser({ roles: [role] })
      const tenant = makeTenant({ users: [user] })
      const unknownUser = makeUser({
        id: toUserId('otherUser'),
        roles: [role],
      })

      expect(tenant.userHasRole(unknownUser, roleName)).toBe(false)
    })
  })
})
