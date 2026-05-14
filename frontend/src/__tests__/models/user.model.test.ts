import { describe, expect, it } from 'vitest'

import { makeRole, makeSsoUser } from '@/__tests__/__factories__'

import { Role } from '@/models/role.model'
import { SsoUser } from '@/models/ssouser.model'
import {
  toUserId,
  User,
  type UserApiData,
  type UserId,
} from '@/models/user.model'

describe('User model', () => {
  it('constructor assigns properties correctly', () => {
    const ssoUser = makeSsoUser()
    const roles = [makeRole()]

    const user = new User(toUserId('user1'), ssoUser, roles)

    expect(user.id).toBe('user1')
    expect(user.ssoUser).toBe(ssoUser)
    expect(user.roles).toEqual(roles)
  })

  it('fromApiData converts API data to User instance correctly', () => {
    const roles = [
      makeRole({ name: 'role1', description: 'desc1' }),
      makeRole({ name: 'role2', description: 'desc2' }),
    ]
    const apiData: UserApiData = {
      id: 'userApi' as UserId,
      ssoUser: makeSsoUser(),
      roles,
    }

    const user = User.fromApiData(apiData)

    expect(user.id).toBe(apiData.id)
    expect(user.ssoUser).toBeInstanceOf(SsoUser)
    expect(user.roles).toHaveLength(roles.length)
    expect(user.roles[0]).toBeInstanceOf(Role)
  })

  it('fromApiData handles missing roles gracefully', () => {
    const apiData: UserApiData = {
      id: toUserId('userApiNoRoles'),
      ssoUser: makeSsoUser(),
    }

    const user = User.fromApiData(apiData)

    expect(user.roles).toEqual([])
  })

  it('fromSearchData sets type to bceidbusiness when username includes bceidbusiness', () => {
    const searchData = {
      email: 'business@example.com',
      firstName: 'Business',
      lastName: 'User',
      username: 'Someuser',
      attributes: {
        bceid_business_guid: ['businessGuid'],
        bceid_business_name: ['businessName'],
        bceid_user_guid: ['userGuid'],
        display_name: ['Business Display'],
      },
    }

    const user = User.fromSearchData(searchData)

    expect(user.ssoUser.idpType).toBe('bceidbusiness')
    expect(user.id).toBe('userGuid')
  })

  it('fromSearchData sets type to bceidbasic when username does not include bceidbusiness', () => {
    const searchData = {
      email: 'basic@example.com',
      firstName: 'Basic',
      lastName: 'User',
      username: String.raw`bceidbasic\someuser`,
      attributes: {
        bceid_user_guid: ['basicGuid'],
        display_name: ['Basic Display'],
      },
    }

    const user = User.fromSearchData(searchData)

    expect(user.ssoUser.idpType).toBe('bceidbasic')
    expect(user.id).toBe('basicGuid')
  })

  it('fromSearchData sets type to bceidbasic when username is undefined', () => {
    const searchData = {
      email: 'nousername@example.com',
      firstName: 'No',
      lastName: 'Username',
      attributes: {
        bceid_user_guid: ['noUsernameGuid'],
        display_name: ['No Username Display'],
      },
    }

    const user = User.fromSearchData(searchData)
    expect(user.ssoUser.idpType).toBe('bceidbasic')
  })

  it('fromSearchData creates User correctly with roles empty', () => {
    const searchData = {
      email: 'search@example.com',
      firstName: 'FirstSearch',
      lastName: 'LastSearch',
      attributes: {
        idir_user_guid: ['searchGuid'],
        idir_username: ['searchUser'],
        display_name: ['Search Display'],
      },
    }

    const user = User.fromSearchData(searchData)

    expect(user.id).toBe('searchGuid')
    expect(user.ssoUser.displayName).toBe('Search Display')
    expect(user.roles).toEqual([])
  })

  it('fromSearchData handles missing idir_userid and displayName gracefully', () => {
    const searchData = {
      email: 'missing@example.com',
      firstName: 'FirstMissing',
      lastName: 'LastMissing',
      attributes: {
        // missing idir_userid and displayName keys
        idir_user_guid: ['guidMissing'],
        // no display_name or displayName keys at all
      },
    }

    const user = User.fromSearchData(searchData)

    // Falls back to idir_user_guid for userId
    expect(user.id).toBe('guidMissing')
    // username should be undefined (not present)
    expect(user.ssoUser.userName).toBeUndefined()
    // displayName fallback is '' empty string
    expect(user.ssoUser.displayName).toBe('')
  })

  it('fromSearchData falls back to idir_userid when idir_user_guid is missing', () => {
    const searchData = {
      email: 'fallback@example.com',
      firstName: 'FallbackFirst',
      lastName: 'FallbackLast',
      attributes: {
        // no idir_user_guid here to force fallback
        idir_userid: ['fallbackUserId'],
        display_name: ['Fallback DisplayName'],
      },
    }

    const user = User.fromSearchData(searchData)

    expect(user.id).toBe('fallbackUserId')
    expect(user.ssoUser.userName).toBeUndefined()
    expect(user.ssoUser.displayName).toBe('Fallback DisplayName')
  })

  it('fromSearchData returns empty string userId when both idir_user_guid and idir_userid are missing', () => {
    const searchData = {
      email: 'emptyid@example.com',
      firstName: 'Empty',
      lastName: 'Id',
      attributes: {
        // no idir_user_guid or idir_userid keys
        display_name: ['Empty DisplayName'],
      },
    }

    const user = User.fromSearchData(searchData)

    expect(user.id).toBe('')
    expect(user.ssoUser.userName).toBeUndefined()
    expect(user.ssoUser.displayName).toBe('Empty DisplayName')
  })

  it('fromSearchData uses attributes.displayName if attributes.display_name is missing', () => {
    const searchData = {
      email: 'displayname2@example.com',
      firstName: 'First',
      lastName: 'Last',
      attributes: {
        displayName: ['DisplayName Present'],
        // no display_name key here
      },
    }

    const user = User.fromSearchData(searchData)

    expect(user.ssoUser.displayName).toBe('DisplayName Present')
  })
})
