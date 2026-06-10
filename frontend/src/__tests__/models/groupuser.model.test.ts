import { describe, expect, it } from 'vitest'

import { makeUser } from '@/__tests__/__factories__'

import { GroupUser, toGroupUserId } from '@/models/groupuser.model'

describe('GroupUser model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const user = makeUser()

      const groupUser = new GroupUser(toGroupUserId('id'), user)

      expect(groupUser.id).toBe('id')
      expect(groupUser.user).toBe(user)
    })
  })
})
