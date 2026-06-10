import { describe, expect, it } from 'vitest'

import { makeUserApiData } from '@/__tests__/__factories__'

import {
  type GroupUserApiData,
  groupUserMapper,
} from '@/mappers/groupuser.mapper'
import { userMapper } from '@/mappers/user.mapper'
import { GroupUser, toGroupUserId } from '@/models/groupuser.model'

describe('GroupUser mapper', () => {
  describe('fromApiData', () => {
    it('creates instance', () => {
      const userApiData = makeUserApiData()
      const user = userMapper.fromApiData(userApiData)
      const apiData: GroupUserApiData = {
        id: toGroupUserId('id'),
        user: userApiData,
      }

      const groupUser = groupUserMapper.fromApiData(apiData)

      expect(groupUser).toBeInstanceOf(GroupUser)
      expect(groupUser.id).toBe('id')
      expect(groupUser.user).toEqual(user)
    })
  })
})
