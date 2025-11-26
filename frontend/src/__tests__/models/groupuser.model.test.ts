import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GroupUser, User, Role, SsoUser } from '@/models'

const fakeSsoUser = new SsoUser(
  'sso-123',
  'jdoe', // optional, but good to provide
  'John',
  'Doe',
  'John Doe',
  'jdoe@example.com', // optional, but provided here
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
    // Create a real User instance or a complete mock
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
    const apiData = new GroupUser('groupUser123', fakeUser) // raw user data matching User.fromApiData input

    const groupUser = GroupUser.fromApiData(apiData)

    expect(User.fromApiData).toHaveBeenCalledWith(apiData.user)
    expect(groupUser).toBeInstanceOf(GroupUser)
    expect(groupUser.id).toBe(apiData.id)
    expect(groupUser.user).toBe(mockedUserInstance)
  })
})
