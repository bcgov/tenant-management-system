import { describe, expect, it } from 'vitest'

import { makeGroupUser } from '@/__tests__/__factories__'

import { Group, toGroupId } from '@/models/group.model'

describe('Group model', () => {
  it('constructor assigns all properties', () => {
    const groupUsers = [makeGroupUser()]

    const group = new Group(
      'created-by',
      'created-date',
      'description',
      toGroupId('id'),
      'name',
      groupUsers,
    )

    expect(group.createdBy).toBe('created-by')
    expect(group.createdDate).toBe('created-date')
    expect(group.description).toBe('description')
    expect(group.id).toBe('id')
    expect(group.name).toBe('name')
    expect(group.groupUsers).toBe(groupUsers)
  })

  it('fromApiData converts API data to Group instance', () => {
    const apiData = {
      createdBy: 'created-by',
      createdDateTime: 'created-date-time',
      description: 'description',
      id: toGroupId('id'),
      name: 'name',
      users: [makeGroupUser()],
    }

    const group = Group.fromApiData(apiData)

    expect(group.createdBy).toBe('created-by')
    expect(group.createdDate).toBe('created-date-time')
    expect(group.description).toBe('description')
    expect(group.id).toBe('id')
    expect(group.name).toBe('name')
    expect(group.groupUsers).toHaveLength(1)
  })

  it('fromApiData handles created by display name', () => {
    const apiData = {
      createdBy: 'created-by',
      createdByDisplayName: 'created-by-display-name',
      createdDateTime: 'created-date-time',
      description: 'description',
      id: toGroupId('id'),
      name: 'name',
      users: [makeGroupUser()],
    }

    const group = Group.fromApiData(apiData)

    expect(group.createdBy).toBe('created-by-display-name')
  })

  it('fromApiData handles non-array users', () => {
    const apiData = {
      createdBy: 'created-by',
      createdDateTime: 'created-date-time',
      description: 'description',
      id: toGroupId('id'),
      name: 'name',
    }

    const group = Group.fromApiData(apiData)

    expect(group.groupUsers).toEqual([])
  })
})
