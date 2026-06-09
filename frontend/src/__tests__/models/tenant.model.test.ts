import { describe, expect, it } from 'vitest'

import {
  makeRole,
  makeSsoUser,
  makeTenant,
  makeUser,
  makeUserApiData,
} from '@/__tests__/__factories__'

import { toSsoUserId } from '@/models/ssouser.model'
import { Tenant, type TenantApiData, toTenantId } from '@/models/tenant.model'
import { User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

describe('Tenant model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const user = makeUser()
      const tenant = new Tenant(
        'createdBy',
        'createdDate',
        'description',
        toTenantId('id'),
        'name',
        'ministryName',
        [user],
      )

      expect(tenant.createdBy).toBe('createdBy')
      expect(tenant.createdDate).toBe('createdDate')
      expect(tenant.description).toBe('description')
      expect(tenant.id).toBe('id')
      expect(tenant.ministryName).toBe('ministryName')
      expect(tenant.name).toBe('name')
      expect(tenant.users.length).toBe(1)
      expect(tenant.users[0]).toBe(user)
    })
  })

  describe('fromApiData', () => {
    it('creates instance', () => {
      const userApiData = makeUserApiData()
      const user = User.fromApiData(userApiData)
      const apiData: TenantApiData = {
        createdBy: 'createdBy',
        createdDateTime: 'createdDateTime',
        description: 'description',
        id: toTenantId('id'),
        ministryName: 'ministryName',
        name: 'name',
        users: [userApiData],
      }

      const tenant = Tenant.fromApiData(apiData)

      expect(tenant.createdBy).toBe('createdBy')
      expect(tenant.createdDate).toBe('createdDateTime')
      expect(tenant.description).toBe('description')
      expect(tenant.id).toBe('id')
      expect(tenant.ministryName).toBe('ministryName')
      expect(tenant.name).toBe('name')
      expect(tenant.users.length).toBe(1)
      expect(tenant.users[0]).toEqual(user)
    })

    it('handles created by display name', () => {
      const apiData = {
        createdBy: 'createdBy',
        createdByDisplayName: 'createdByDisplayName',
        createdDateTime: 'createdDateTime',
        description: 'description',
        id: toTenantId('id'),
        ministryName: 'ministryName',
        name: 'name',
        users: [],
      }

      const tenant = Tenant.fromApiData(apiData)

      expect(tenant.createdBy).toBe('createdByDisplayName')
    })
  })

  describe('findUser', () => {
    it('returns the matching user', () => {
      const ssoUserId = toSsoUserId('sso1')
      const user = makeUser({ ssoUser: makeSsoUser({ ssoUserId }) })
      const tenant = makeTenant({ users: [user] })

      expect(tenant.findUser(ssoUserId)).toEqual(user)
    })

    it('returns not defined when not found', () => {
      const ssoUserId = toSsoUserId('sso1')
      const user = makeUser({ ssoUser: makeSsoUser({ ssoUserId }) })
      const tenant = makeTenant({ users: [user] })

      expect(tenant.findUser(toSsoUserId('not-found'))).toBeUndefined()
    })
  })

  describe('getOwners', () => {
    it('returns users with TENANT_OWNER role', () => {
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
      const tenant = makeTenant({ users: [ownerUser, otherUser] })

      expect(tenant.getOwners()).toEqual([ownerUser])
    })
  })

  describe('userHasRole', () => {
    it('returns true if user has role', () => {
      const roleName = ROLES.TENANT_OWNER.value
      const user = makeUser({
        roles: [
          makeRole({ description: 'Owner role', id: 'r1', name: roleName }),
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
            id: 'r1',
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
        id: 'r1',
        name: 'OtherRole',
      })
      const user = makeUser({ roles: [role] })
      const tenant = makeTenant({ users: [user] })
      const unknownUser = makeUser({
        id: 'otherUser',
        roles: [role],
      })

      expect(tenant.userHasRole(unknownUser, roleName)).toBe(false)
    })
  })
})
