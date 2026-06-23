import { describe, expect, it } from 'vitest'

import { makeRole, makeSsoUser } from '@/__tests__/__factories__'

import { toUserId, User } from '@/models/user.model'

describe('User model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const roles = [makeRole()]
      const ssoUser = makeSsoUser()

      const user = new User({ id: toUserId('id'), roles, ssoUser })

      expect(user.id).toBe('id')
      expect(user.roles).toEqual(roles)
      expect(user.ssoUser).toEqual(ssoUser)
    })

    it('handles empty roles', () => {
      const ssoUser = makeSsoUser()

      const user = new User({ id: toUserId('id'), roles: [], ssoUser })

      expect(user.roles.length).toBe(0)
    })
  })
})
