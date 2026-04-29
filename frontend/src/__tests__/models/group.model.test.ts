import { describe, expect, it } from 'vitest'

import { makeGroupUser } from '@/__tests__/__factories__'
import { Group, type GroupId } from '@/models/group.model'

describe('Group model', () => {
  it('constructor assigns all properties', () => {
    const groupUsers = [makeGroupUser()]

    const group = new Group(
      'created-by',
      'created-date',
      'description',
      'id' as GroupId,
      'name',
      groupUsers,
    )

    expect(group.createdBy).toEqual('created-by')
    expect(group.createdDate).toEqual('created-date')
    expect(group.description).toEqual('description')
    expect(group.id).toEqual('id')
    expect(group.name).toEqual('name')
    expect(group.groupUsers).toEqual(groupUsers)
  })

  it('fromApiData converts API data to Group instance', () => {
    const apiData = {
      createdBy: 'created-by',
      createdDateTime: 'created-date-time',
      description: 'description',
      id: 'id' as GroupId,
      name: 'name',
      users: [makeGroupUser()],
    }

    const group = Group.fromApiData(apiData)

    expect(group.createdBy).toEqual('created-by')
    expect(group.createdDate).toEqual('created-date-time')
    expect(group.description).toEqual('description')
    expect(group.id).toEqual('id')
    expect(group.name).toEqual('name')
    expect(group.groupUsers).toHaveLength(apiData.users.length)
  })

  it('fromApiData handles created by username', () => {
    const apiData = {
      createdBy: 'created-by',
      createdByUserName: 'created-by-username',
      createdDateTime: 'created-date-time',
      description: 'description',
      id: 'id' as GroupId,
      name: 'name',
      users: [makeGroupUser()],
    }

    const group = Group.fromApiData(apiData)

    expect(group.createdBy).toEqual('created-by-username')
  })

  it('fromApiData handles non-array users', () => {
    const apiData = {
      createdBy: 'created-by',
      createdDateTime: 'created-date-time',
      description: 'description',
      id: 'id' as GroupId,
      name: 'name',
    }

    const group = Group.fromApiData(apiData)

    expect(group.groupUsers).toEqual([])
  })
})
