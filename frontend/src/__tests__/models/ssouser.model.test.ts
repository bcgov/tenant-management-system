import { describe, it, expect } from 'vitest'

import {
  SsoUser,
  toSsoUserId,
  type SsoUserApiData,
} from '@/models/ssouser.model'

describe('SsoUser model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const ssoUser = new SsoUser(
        toSsoUserId('ssoUserId'),
        'userName',
        'firstName',
        'lastName',
        'displayName',
        'email',
        'idpType',
      )

      expect(ssoUser.displayName).toBe('displayName')
      expect(ssoUser.email).toBe('email')
      expect(ssoUser.firstName).toBe('firstName')
      expect(ssoUser.idpType).toBe('idpType')
      expect(ssoUser.lastName).toBe('lastName')
      expect(ssoUser.ssoUserId).toBe('ssoUserId')
      expect(ssoUser.userName).toBe('userName')
    })

    it('handles missing optional fields', () => {
      const ssoUser = new SsoUser(
        toSsoUserId('ssoUserId'),
        undefined,
        'firstName',
        'lastName',
        'displayName',
        undefined,
        'idpType',
      )

      expect(ssoUser.email).toBeUndefined()
      expect(ssoUser.userName).toBeUndefined()
    })
  })

  describe('fromApiData', () => {
    it('creates instance', () => {
      const apiData: SsoUserApiData = {
        displayName: 'displayName',
        email: 'email',
        firstName: 'firstName',
        idpType: 'idpType',
        lastName: 'lastName',
        ssoUserId: toSsoUserId('ssoUserId'),
        userName: 'userName',
      }

      const ssoUser = SsoUser.fromApiData(apiData)

      expect(ssoUser).toBeInstanceOf(SsoUser)
      expect(ssoUser.displayName).toBe('displayName')
      expect(ssoUser.email).toBe('email')
      expect(ssoUser.firstName).toBe('firstName')
      expect(ssoUser.idpType).toBe('idpType')
      expect(ssoUser.lastName).toBe('lastName')
      expect(ssoUser.ssoUserId).toBe('ssoUserId')
      expect(ssoUser.userName).toBe('userName')
    })

    it('creates instance without optional fields', () => {
      const apiData: SsoUserApiData = {
        displayName: 'displayName',
        firstName: 'firstName',
        idpType: 'idpType',
        lastName: 'lastName',
        ssoUserId: toSsoUserId('ssoUserId'),
      }

      const ssoUser = SsoUser.fromApiData(apiData)

      expect(ssoUser.email).toBeUndefined()
      expect(ssoUser.userName).toBeUndefined()
    })
  })
})
