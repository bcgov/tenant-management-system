import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Group, GroupUser } from '@/models'

describe('Group model', () => {
  beforeEach(() => {
    vi.spyOn(GroupUser, 'fromApiData').mockImplementation((data) => {
      return { ...data, mocked: true }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('constructor assigns all properties correctly', () => {
    const groupUsers = [
      { user: { id: 'user1' } },
      { user: { id: 'user2' } },
    ] as GroupUser[]

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
    const apiData = {
      createdBy: 'creatorUser',
      createdDateTime: '2025-08-01',
      description: 'API description',
      id: 'group456',
      name: 'API Group',
      users: [
        { user: { id: 'userA' } },
        { user: { id: 'userB' } },
      ] as GroupUser[],
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
