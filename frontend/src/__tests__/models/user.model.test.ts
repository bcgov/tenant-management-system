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

      expect(user.roles).toHaveLength(0)
    })
  })

  describe('getName', () => {
    it('returns first and last name for an IDIR user', () => {
      const ssoUser = makeSsoUser({
        firstName: 'firstName',
        lastName: 'lastName',
        idpType: 'idir',
      })
      const user = new User({
        id: toUserId('id'),
        roles: [],
        ssoUser,
      })

      expect(user.getName()).toBe('firstName lastName')
    })

    it('returns first name only for a BCeID user', () => {
      const ssoUser = makeSsoUser({
        firstName: 'firstName',
        lastName: 'lastName',
        idpType: 'bceidbusiness',
      })
      const user = new User({
        id: toUserId('id'),
        roles: [],
        ssoUser,
      })

      expect(user.getName()).toBe('firstName')
    })
  })

  describe('isBceid', () => {
    it('returns true for a business BCeID user', () => {
      const ssoUser = makeSsoUser({ idpType: 'bceidbusiness' })
      const user = new User({
        id: toUserId('id'),
        roles: [],
        ssoUser,
      })

      expect(user.isBceid()).toBe(true)
    })

    it('returns false for an IDIR user', () => {
      const ssoUser = makeSsoUser({ idpType: 'idir' })
      const user = new User({
        id: toUserId('id'),
        roles: [],
        ssoUser,
      })

      expect(user.isBceid()).toBe(false)
    })
  })

  describe('isIdir', () => {
    it('returns true for an IDIR user', () => {
      const ssoUser = makeSsoUser({ idpType: 'idir' })
      const user = new User({
        id: toUserId('id'),
        roles: [],
        ssoUser,
      })

      expect(user.isIdir()).toBe(true)
    })

    it('returns false for a business BCeID user', () => {
      const ssoUser = makeSsoUser({ idpType: 'bceidbusiness' })
      const user = new User({
        id: toUserId('id'),
        roles: [],
        ssoUser,
      })

      expect(user.isIdir()).toBe(false)
    })
  })
})
