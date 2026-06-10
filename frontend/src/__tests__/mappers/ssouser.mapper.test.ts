import { describe, it, expect } from 'vitest'

import { type SsoUserApiData, ssoUserMapper } from '@/mappers/ssouser.mapper'
import { SsoUser, toSsoUserId } from '@/models/ssouser.model'

describe('SsoUser mapper', () => {
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

      const ssoUser = ssoUserMapper.fromApiData(apiData)

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

      const ssoUser = ssoUserMapper.fromApiData(apiData)

      expect(ssoUser).toBeInstanceOf(SsoUser)
      expect(ssoUser.email).toBeUndefined()
      expect(ssoUser.userName).toBeUndefined()
    })
  })
})
