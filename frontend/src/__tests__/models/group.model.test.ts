import { describe, expect, it } from 'vitest'

import { makeGroupUser } from '@/__tests__/__factories__'

import { Group, toGroupId } from '@/models/group.model'

describe('Group model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const groupUsers = [makeGroupUser()]

      const group = new Group({
        createdBy: 'createdBy',
        createdDate: 'createdDate',
        description: 'description',
        groupUsers,
        id: toGroupId('id'),
        name: 'name',
      })

      expect(group.createdBy).toBe('createdBy')
      expect(group.createdDate).toBe('createdDate')
      expect(group.description).toBe('description')
      expect(group.groupUsers).toBe(groupUsers)
      expect(group.id).toBe('id')
      expect(group.name).toBe('name')
    })

    it('handles empty group users', () => {
      const group = new Group({
        createdBy: 'createdBy',
        createdDate: 'createdDate',
        description: 'description',
        id: toGroupId('id'),
        groupUsers: [],
        name: 'name',
      })

      expect(group.groupUsers).toEqual([])
    })
  })
})
