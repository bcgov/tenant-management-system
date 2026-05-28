import { describe, expect, it } from 'vitest'

import { makeUser, makeUserApiData } from '@/__tests__/__factories__'

import {
  GroupUser,
  toGroupUserId,
  type GroupUserApiData,
} from '@/models/groupuser.model'
import { User } from '@/models/user.model'

describe('GroupUser model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const user = makeUser()

      const groupUser = new GroupUser(toGroupUserId('id'), user)

      expect(groupUser.id).toBe('id')
      expect(groupUser.user).toBe(user)
    })
  })

  describe('fromApiData', () => {
    it('creates instance', () => {
      const userApiData = makeUserApiData()
      const user = User.fromApiData(userApiData)
      const apiData: GroupUserApiData = {
        id: toGroupUserId('id'),
        user: userApiData,
      }

      const groupUser = GroupUser.fromApiData(apiData)

      expect(groupUser).toBeInstanceOf(GroupUser)
      expect(groupUser.id).toBe('id')
      expect(groupUser.user).toEqual(user)
    })
  })
})
