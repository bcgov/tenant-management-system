import { describe, it, expect } from 'vitest'
import { Role, SsoUser, User } from '@/models'
import type { UserId } from '@/models/user.model'
import type { RoleId } from '@/models/role.model'

describe('User model', () => {
  it('constructor assigns properties correctly', () => {
    const ssoUser = new SsoUser(
      'sso1',
      'username1',
      'First',
      'Last',
      'Display',
      'email@example.com',
    )
    const roles = [new Role('r1', 'role1', 'desc1')]
    const user = new User('user1', ssoUser, roles)

    expect(user.id).toBe('user1')
    expect(user.ssoUser).toBe(ssoUser)
    expect(user.roles).toEqual(roles)
  })

  it('constructor defaults roles to empty array if invalid', () => {
    const ssoUser = new SsoUser(
      'sso2',
      'username2',
      'First2',
      'Last2',
      'Display2',
      'email2@example.com',
    )
    // @ts-expect-error Testing fallback for invalid roles
    const user = new User('user2', ssoUser, null)

    expect(user.roles).toEqual([])
  })

  it('fromApiData converts API data to User instance correctly', () => {
    const apiData = {
      id: 'userApi' as UserId,
      ssoUser: new SsoUser(
        'ssoApi',
        'usernameApi',
        'FirstApi',
        'LastApi',
        'DisplayApi',
        'api@example.com',
      ),
      roles: [
        { id: 'r1' as RoleId, name: 'role1', description: 'desc1' },
        { id: 'r2' as RoleId, name: 'role2', description: 'desc2' },
      ],
    }

    const user = User.fromApiData(apiData)

    expect(user.id).toBe(apiData.id)
    expect(user.ssoUser).toBeInstanceOf(SsoUser)
    expect(user.roles).toHaveLength(apiData.roles.length)
    expect(user.roles[0]).toBeInstanceOf(Role)
  })

  it('fromApiData handles missing roles gracefully', () => {
    const apiData = {
      id: 'userApiNoRoles',
      ssoUser: new SsoUser(
        'ssoNoRoles',
        'usernameNoRoles',
        'FirstNoRoles',
        'LastNoRoles',
        'DisplayNoRoles',
        'noroles@example.com',
      ),
    }

    const user = User.fromApiData(apiData)

    expect(user.roles).toEqual([])
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
