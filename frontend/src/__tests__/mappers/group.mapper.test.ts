import { describe, expect, it } from 'vitest'

import {
  makeGroupServiceApiData,
  makeGroupUserApiData,
} from '@/__tests__/__factories__'

import { type GroupApiData, groupMapper } from '@/mappers/group.mapper'
import { Group, toGroupId } from '@/models/group.model'
import { groupServiceMapper } from '@/mappers/groupservice.mapper'
import { groupUserMapper } from '@/mappers/groupuser.mapper'

describe('Group mapper', () => {
  describe('fromApiData', () => {
    it('creates instance', () => {
      const groupServiceApiData = makeGroupServiceApiData()
      const groupService = groupServiceMapper.fromApiData(groupServiceApiData)
      const groupUserApiData = makeGroupUserApiData()
      const groupUser = groupUserMapper.fromApiData(groupUserApiData)
      const apiData: GroupApiData = {
        createdBy: 'createdBy',
        createdDateTime: 'createdDateTime',
        description: 'description',
        id: toGroupId('id'),
        name: 'name',
        sharedServices: [groupServiceApiData],
        users: [groupUserApiData],
      }

      const group = groupMapper.fromApiData(apiData)

      expect(group).toBeInstanceOf(Group)
      expect(group.createdBy).toBe('createdBy')
      expect(group.createdDate).toBe('createdDateTime')
      expect(group.description).toBe('description')
      expect(group.groupServices).toHaveLength(1)
      expect(group.groupServices[0]).toEqual(groupService)
      expect(group.groupUsers).toHaveLength(1)
      expect(group.groupUsers[0]).toEqual(groupUser)
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
        sharedServices: [makeGroupServiceApiData()],
        users: [makeGroupUserApiData()],
      }

      const group = groupMapper.fromApiData(apiData)

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

      const group = groupMapper.fromApiData(apiData)

      expect(group).toBeInstanceOf(Group)
      expect(group.groupUsers).toEqual([])
    })
  })
})
