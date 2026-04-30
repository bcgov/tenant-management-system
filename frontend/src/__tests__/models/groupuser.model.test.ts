import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { makeSsoUser, makeUser } from '@/__tests__/__factories__'

import { GroupUser, toGroupUserId } from '@/models/groupuser.model'
import { Role } from '@/models/role.model'
import { toUserId, User } from '@/models/user.model'

const fakeSsoUser = makeSsoUser()

const fakeUserData = {
  id: 'user1',
  ssoUser: fakeSsoUser,
  roles: [] as Role[],
}

const fakeUser = makeUser({ ssoUser: fakeSsoUser })

describe('GroupUser model', () => {
  let mockedUserInstance: User

  beforeEach(() => {
    mockedUserInstance = new User(
      toUserId(fakeUserData.id),
      fakeSsoUser,
      fakeUserData.roles,
    )

    vi.spyOn(User, 'fromApiData').mockImplementation(() => mockedUserInstance)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('constructor assigns properties correctly', () => {
    const groupUser = new GroupUser(
      toGroupUserId('groupUserId'),
      mockedUserInstance,
    )
    expect(groupUser.id).toBe('groupUserId')
    expect(groupUser.user).toBe(mockedUserInstance)
  })

  it('fromApiData converts API data to GroupUser instance correctly', () => {
    const apiData = new GroupUser(toGroupUserId('groupUser123'), fakeUser)

    const groupUser = GroupUser.fromApiData(apiData)

    expect(User.fromApiData).toHaveBeenCalledWith(apiData.user)
    expect(groupUser).toBeInstanceOf(GroupUser)
    expect(groupUser.id).toBe(apiData.id)
    expect(groupUser.user).toBe(mockedUserInstance)
  })
})
