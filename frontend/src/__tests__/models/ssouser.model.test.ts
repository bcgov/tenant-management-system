import { describe, it, expect } from 'vitest'

import {
  SsoUser,
  toSsoUserId,
  type SsoUserApiData,
} from '@/models/ssouser.model'

describe('SsoUser model', () => {
  it('constructor assigns all properties correctly', () => {
    const ssoUser = new SsoUser(
      toSsoUserId('sso123'),
      'jdoe',
      'John',
      'Doe',
      'John Doe',
      'jdoe@example.com',
      'idir',
    )

    expect(ssoUser.ssoUserId).toBe('sso123')
    expect(ssoUser.userName).toBe('jdoe')
    expect(ssoUser.firstName).toBe('John')
    expect(ssoUser.lastName).toBe('Doe')
    expect(ssoUser.displayName).toBe('John Doe')
    expect(ssoUser.email).toBe('jdoe@example.com')
  })

  it('constructor works with missing optional fields', () => {
    const ssoUser = new SsoUser(
      toSsoUserId('sso456'),
      undefined,
      'Jane',
      'Smith',
      'Jane Smith',
      undefined,
      'idir',
    )

    expect(ssoUser.ssoUserId).toBe('sso456')
    expect(ssoUser.userName).toBeUndefined()
    expect(ssoUser.email).toBeUndefined()
  })

  it('fromApiData creates SsoUser instance correctly with all fields', () => {
    const apiData: SsoUserApiData = {
      ssoUserId: toSsoUserId('sso789'),
      userName: 'jsmith',
      firstName: 'Joe',
      lastName: 'Smith',
      displayName: 'Joe Smith',
      email: 'joe.smith@example.com',
      idpType: 'idir',
    }

    const ssoUser = SsoUser.fromApiData(apiData)

    expect(ssoUser).toBeInstanceOf(SsoUser)
    expect(ssoUser.ssoUserId).toBe(apiData.ssoUserId)
    expect(ssoUser.userName).toBe(apiData.userName)
    expect(ssoUser.firstName).toBe(apiData.firstName)
    expect(ssoUser.lastName).toBe(apiData.lastName)
    expect(ssoUser.displayName).toBe(apiData.displayName)
    expect(ssoUser.email).toBe(apiData.email)
  })

  it('fromApiData creates SsoUser instance correctly without optional fields', () => {
    const apiData: SsoUserApiData = {
      ssoUserId: toSsoUserId('sso101'),
      firstName: 'Alice',
      lastName: 'Wonderland',
      displayName: 'Alice W.',
      // userName and email omitted intentionally
    }

    const ssoUser = SsoUser.fromApiData(apiData)

    expect(ssoUser.userName).toBeUndefined()
    expect(ssoUser.email).toBeUndefined()
    expect(ssoUser.firstName).toBe(apiData.firstName)
    expect(ssoUser.lastName).toBe(apiData.lastName)
  })
})
