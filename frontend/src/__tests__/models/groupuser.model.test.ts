import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GroupUser, User, Role } from '@/models'

const fakeSsoUser = {
  ssoUserId: 'sso-123',
  userName: 'jdoe', // optional, but good to provide
  firstName: 'John',
  lastName: 'Doe',
  displayName: 'John Doe',
  email: 'jdoe@example.com', // optional, but provided here
}

const fakeUserData = {
  id: 'user1',
  ssoUser: fakeSsoUser,
  roles: [] as Role[],
}

describe('GroupUser model', () => {
  let mockedUserInstance: User

  beforeEach(() => {
    // Create a real User instance or a complete mock
    mockedUserInstance = new User(
      fakeUserData.id,
      fakeUserData.ssoUser,
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
    const apiData = {
      id: 'groupUser123',
      user: fakeUserData, // raw user data matching User.fromApiData input
    }

    const groupUser = GroupUser.fromApiData(apiData)

    expect(User.fromApiData).toHaveBeenCalledWith(apiData.user)
    expect(groupUser).toBeInstanceOf(GroupUser)
    expect(groupUser.id).toBe(apiData.id)
    expect(groupUser.user).toBe(mockedUserInstance)
  })
})
