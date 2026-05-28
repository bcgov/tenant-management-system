import { describe, expect, it } from 'vitest'

import { makeGroupUser, makeGroupUserApiData } from '@/__tests__/__factories__'

import { Group, type GroupApiData, toGroupId } from '@/models/group.model'

describe('Group model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const groupUsers = [makeGroupUser()]

      const group = new Group(
        'createdBy',
        'createdDate',
        'description',
        toGroupId('id'),
        'name',
        groupUsers,
      )

      expect(group.createdBy).toBe('createdBy')
      expect(group.createdDate).toBe('createdDate')
      expect(group.description).toBe('description')
      expect(group.groupUsers).toBe(groupUsers)
      expect(group.id).toBe('id')
      expect(group.name).toBe('name')
    })
  })

  describe('fromApiData', () => {
    it('creates instance', () => {
      const apiData: GroupApiData = {
        createdBy: 'createdBy',
        createdDateTime: 'createdDateTime',
        description: 'description',
        id: toGroupId('id'),
        name: 'name',
        users: [makeGroupUserApiData()],
      }

      const group = Group.fromApiData(apiData)

      expect(group).toBeInstanceOf(Group)
      expect(group.createdBy).toBe('createdBy')
      expect(group.createdDate).toBe('createdDateTime')
      expect(group.description).toBe('description')
      expect(group.groupUsers).toHaveLength(1)
      expect(group.id).toBe('id')
      expect(group.name).toBe('name')
    })

    it('handles created by display name', () => {
      const apiData: GroupApiData = {
        createdBy: 'createdBy',
        createdByDisplayName: 'createdByDisplayName',
        createdDateTime: 'createdDateTime',
        description: 'description',
        id: toGroupId('id'),
        name: 'name',
        users: [makeGroupUserApiData()],
      }

      const group = Group.fromApiData(apiData)

      expect(group).toBeInstanceOf(Group)
      expect(group.createdBy).toBe('createdByDisplayName')
    })

    it('handles missing users', () => {
      const apiData: GroupApiData = {
        createdBy: 'createdBy',
        createdDateTime: 'createdDateTime',
        description: 'description',
        id: toGroupId('id'),
        name: 'name',
      }

      const group = Group.fromApiData(apiData)

      expect(group).toBeInstanceOf(Group)
      expect(group.groupUsers).toEqual([])
    })
  })
})
