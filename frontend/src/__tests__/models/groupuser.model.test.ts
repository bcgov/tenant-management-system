import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GroupUser } from '@/models/groupuser.model'
import { Role } from '@/models/role.model'
import { SsoUser } from '@/models/ssouser.model'
import { User } from '@/models/user.model'

const fakeSsoUser = new SsoUser(
  'sso-123',
  'jdoe',
  'John',
  'Doe',
  'John Doe',
  'jdoe@example.com',
)

const fakeUserData = {
  id: 'user1',
  ssoUser: fakeSsoUser,
  roles: [] as Role[],
}

const fakeUser = new User(fakeUserData.id, fakeSsoUser, fakeUserData.roles)

describe('GroupUser model', () => {
  let mockedUserInstance: User

  beforeEach(() => {
    mockedUserInstance = new User(
      fakeUserData.id,
      fakeSsoUser,
      fakeUserData.roles,
    )

    vi.spyOn(User, 'fromApiData').mockImplementation(() => mockedUserInstance)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('constructor assigns properties correctly', () => {
    const groupUser = new GroupUser('groupUserId', mockedUserInstance)
    expect(groupUser.id).toBe('groupUserId')
    expect(groupUser.user).toBe(mockedUserInstance)
  })

  it('fromApiData converts API data to GroupUser instance correctly', () => {
    const apiData = new GroupUser('groupUser123', fakeUser)

    const groupUser = GroupUser.fromApiData(apiData)

    expect(User.fromApiData).toHaveBeenCalledWith(apiData.user)
    expect(groupUser).toBeInstanceOf(GroupUser)
    expect(groupUser.id).toBe(apiData.id)
    expect(groupUser.user).toBe(mockedUserInstance)
  })
})
