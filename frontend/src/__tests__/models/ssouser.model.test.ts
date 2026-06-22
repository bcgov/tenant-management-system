import { describe, it, expect } from 'vitest'

import { SsoUser, toSsoUserId } from '@/models/ssouser.model'

describe('SsoUser model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const ssoUser = new SsoUser({
        displayName: 'displayName',
        email: 'email',
        firstName: 'firstName',
        idpType: 'idpType',
        lastName: 'lastName',
        ssoUserId: toSsoUserId('ssoUserId'),
        userName: 'userName',
      })

      expect(ssoUser.displayName).toBe('displayName')
      expect(ssoUser.email).toBe('email')
      expect(ssoUser.firstName).toBe('firstName')
      expect(ssoUser.idpType).toBe('idpType')
      expect(ssoUser.lastName).toBe('lastName')
      expect(ssoUser.ssoUserId).toBe('ssoUserId')
      expect(ssoUser.userName).toBe('userName')
    })

    it('handles missing optional fields', () => {
      const ssoUser = new SsoUser({
        displayName: 'displayName',
        firstName: 'firstName',
        idpType: 'idpType',
        lastName: 'lastName',
        ssoUserId: toSsoUserId('ssoUserId'),
      })

      expect(ssoUser.email).toBeUndefined()
      expect(ssoUser.userName).toBeUndefined()
    })
  })
})
