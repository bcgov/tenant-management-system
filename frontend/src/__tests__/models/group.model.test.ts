import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Group, GroupUser, SsoUser, User } from '@/models'
import type { GroupId } from '@/models/group.model'

describe('Group model', () => {
  beforeEach(() => {
    vi.spyOn(GroupUser, 'fromApiData').mockImplementation((data) => {
      const fakeSsoUser = new SsoUser(
        data.user.id,
        undefined,
        '',
        '',
        '',
        undefined,
      )
      const gu = new GroupUser(data.id, new User(data.user.id, fakeSsoUser))
      return { ...gu, mocked: true }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('constructor assigns all properties correctly', () => {
    const fakeSsoUser = new SsoUser('235', undefined, '', '', '', undefined)
    const groupUsers: GroupUser[] = []
    groupUsers.push(
      new GroupUser('user1', new User('user1', fakeSsoUser)),
      new GroupUser('user2', new User('user2', fakeSsoUser))
    )

    const group = new Group(
      'creatorUser',
      '2025-08-01',
      'Group description',
      'group123',
      'Group Name',
      groupUsers,
    )

    expect(group.groupUsers).toEqual(groupUsers)
  })

  it('constructor sets groupUsers to empty array if not an array', () => {
    const group = new Group(
      'creatorUser',
      '2025-08-01',
      'Group description',
      'group123',
      'Group Name',
      null as unknown as GroupUser[],
    )

    expect(group.groupUsers).toEqual([])
  })

  it('fromApiData converts API data to Group instance correctly', () => {
    const fakeSsoUser = new SsoUser('userA', undefined, '', '', '', undefined)
    const gus = [
      new GroupUser('userA', new User('userA', fakeSsoUser)),
      new GroupUser('userB', new User('userB', fakeSsoUser)),
    ]

    const apiData = {
      createdBy: 'creatorUser',
      createdDateTime: '2025-08-01',
      description: 'API description',
      id: 'group456' as GroupId,
      name: 'API Group',
      users: gus,
    }

    const group = Group.fromApiData(apiData)

    expect(GroupUser.fromApiData).toHaveBeenCalledTimes(apiData.users.length)
    expect(group.groupUsers).toHaveLength(apiData.users.length)
  })

  it('fromApiData handles non-array users gracefully', () => {
    type GroupApiData = Omit<
      Parameters<typeof Group.fromApiData>[0],
      'users'
    > & {
      users: GroupUser[] | null
    }

    const apiData: GroupApiData = {
      createdBy: 'creatorUser',
      createdDateTime: '2025-08-01',
      description: 'API description',
      id: 'group789',
      name: 'API Group',
      users: null,
    }

    // Type assertion to force call with nullable users (invalid input
    // simulation)
    const group = Group.fromApiData(
      apiData as unknown as Parameters<typeof Group.fromApiData>[0],
    )

    expect(group.groupUsers).toEqual([])
  })
})
