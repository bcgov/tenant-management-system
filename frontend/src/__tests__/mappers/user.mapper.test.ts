import { describe, expect, it } from 'vitest'

import {
  makeRoleApiData,
  makeSsoUser,
  makeSsoUserApiData,
} from '@/__tests__/__factories__'

import { ssoUserMapper } from '@/mappers/ssouser.mapper'
import {
  type UserApiData,
  userMapper,
  type UserSearchApiData,
} from '@/mappers/user.mapper'
import { toUserId } from '@/models/user.model'
import { roleMapper } from '@/mappers/role.mapper'

describe('User mapper', () => {
  describe('fromApiData', () => {
    it('creates instance', () => {
      const roleApiData = makeRoleApiData()
      const role = roleMapper.fromApiData(roleApiData)
      const ssoUserApiData = makeSsoUserApiData()
      const ssoUser = ssoUserMapper.fromApiData(ssoUserApiData)
      const apiData: UserApiData = {
        id: toUserId('id'),
        roles: [roleApiData],
        ssoUser: ssoUserApiData,
      }

      const user = userMapper.fromApiData(apiData)

      expect(user.id).toBe('id')
      expect(user.roles.length).toEqual(1)
      expect(user.roles[0]).toEqual(role)
      expect(user.ssoUser).toEqual(ssoUser)
    })

    it('handles missing roles', () => {
      const apiData: UserApiData = {
        id: toUserId('id'),
        ssoUser: makeSsoUser(),
      }

      const user = userMapper.fromApiData(apiData)

      expect(user.roles).toEqual([])
    })
  })

  describe('fromSearchData', () => {
    it('creates instance for bceidbusiness', () => {
      const searchData: UserSearchApiData = {
        attributes: {
          bceid_business_guid: ['bceid_business_guid'],
          bceid_business_name: ['bceid_business_name'],
          bceid_user_guid: ['bceid_user_guid'],
          display_name: ['display_name'],
        },
        email: 'email',
        firstName: 'firstName',
        lastName: 'lastName',
      }

      const user = userMapper.fromSearchData(searchData)

      expect(user.id).toBe('')
      expect(user.roles).toEqual([])
      expect(user.ssoUser.displayName).toBe('display_name')
      expect(user.ssoUser.email).toBe('email')
      expect(user.ssoUser.firstName).toBe('firstName')
      expect(user.ssoUser.idpType).toBe('bceidbusiness')
      expect(user.ssoUser.lastName).toBe('lastName')
      expect(user.ssoUser.ssoUserId).toBe('bceid_user_guid')
      expect(user.ssoUser.userName).toBeUndefined()
    })

    it('creates instance for idir', () => {
      const searchData: UserSearchApiData = {
        attributes: {
          display_name: ['display_name'],
          idir_user_guid: ['idir_user_guid'],
          idir_username: ['idir_username'],
        },
        email: 'email',
        firstName: 'firstName',
        lastName: 'lastName',
      }

      const user = userMapper.fromSearchData(searchData)

      expect(user.id).toBe('')
      expect(user.roles).toEqual([])
      expect(user.ssoUser.displayName).toBe('display_name')
      expect(user.ssoUser.email).toBe('email')
      expect(user.ssoUser.firstName).toBe('firstName')
      expect(user.ssoUser.idpType).toBe('idir')
      expect(user.ssoUser.lastName).toBe('lastName')
      expect(user.ssoUser.ssoUserId).toBe('idir_user_guid')
      expect(user.ssoUser.userName).toBe('idir_username')
    })

    it('handles missing display_name and idir_username', () => {
      const searchData: UserSearchApiData = {
        attributes: {
          idir_user_guid: ['idir_user_guid'],
        },
        email: 'email',
        firstName: 'firstName',
        lastName: 'lastName',
      }

      const user = userMapper.fromSearchData(searchData)

      expect(user.ssoUser.userName).toBeUndefined()
      expect(user.ssoUser.displayName).toBe('')
    })

    it('returns empty userId', () => {
      const searchData: UserSearchApiData = {
        attributes: {
          display_name: ['display_name'],
        },
        email: 'email',
        firstName: 'firstName',
        lastName: 'lastName',
      }

      const user = userMapper.fromSearchData(searchData)

      expect(user.id).toBe('')
      expect(user.ssoUser.displayName).toBe('display_name')
      expect(user.ssoUser.userName).toBeUndefined()
    })
  })
})
