import { describe, it, expect } from 'vitest'

import {
  identityProviderToDisplay,
  isIdpBceid,
  isIdpIdir,
} from '@/utils/identityProvider'

describe('identityProviderToDisplay', () => {
  it('returns empty string for undefined', () => {
    expect(identityProviderToDisplay(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(identityProviderToDisplay('')).toBe('')
  })

  it('converts azureidir to IDIR display', () => {
    expect(identityProviderToDisplay('azureidir')).toBe('IDIR')
  })

  it('converts bceidbasic to BCeID display', () => {
    expect(identityProviderToDisplay('bceidbasic')).toBe('Basic BCeID')
  })

  it('converts bceidbusiness to BCeID display', () => {
    expect(identityProviderToDisplay('bceidbusiness')).toBe('Business BCeID')
  })

  it('converts idir to IDIR display', () => {
    expect(identityProviderToDisplay('idir')).toBe('IDIR')
  })

  it('is case-insensitive', () => {
    expect(identityProviderToDisplay('AZUREIDIR')).toBe('IDIR')
    expect(identityProviderToDisplay('AzureIdir')).toBe('IDIR')
  })

  it('passes through unknown IdP as-is', () => {
    expect(identityProviderToDisplay('someunknownidp')).toBe('someunknownidp')
  })
})

describe('isIdpBceid', () => {
  it('resolves undefined to false', () => {
    expect(isIdpBceid(undefined)).toBe(false)
  })

  it('resolves empty string to false', () => {
    expect(isIdpBceid('')).toBe(false)
  })

  it('resolves azureidir to false', () => {
    expect(isIdpBceid('azureidir')).toBe(false)
  })

  it('resolves bceidbasic to true', () => {
    expect(isIdpBceid('bceidbasic')).toBe(true)
  })

  it('resolves bceidbusiness to true', () => {
    expect(isIdpBceid('bceidbusiness')).toBe(true)
  })

  it('resolves idir to false', () => {
    expect(isIdpBceid('idir')).toBe(false)
  })

  it('resolves unrecognized IdP to false', () => {
    expect(isIdpBceid('thisismyidir')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isIdpBceid('BCEIDBASIC')).toBe(true)
    expect(isIdpBceid('BCeIDBasic')).toBe(true)
  })
})

describe('isIdpIdir', () => {
  it('resolves undefined to false', () => {
    expect(isIdpIdir(undefined)).toBe(false)
  })

  it('resolves empty string to false', () => {
    expect(isIdpIdir('')).toBe(false)
  })

  it('resolves azureidir to true', () => {
    expect(isIdpIdir('azureidir')).toBe(true)
  })

  it('resolves bceidbasic to false', () => {
    expect(isIdpIdir('bceidbasic')).toBe(false)
  })

  it('resolves bceidbusiness to false', () => {
    expect(isIdpIdir('bceidbusiness')).toBe(false)
  })

  it('resolves idir to true', () => {
    expect(isIdpIdir('idir')).toBe(true)
  })

  it('resolves unrecognized IdP to false', () => {
    expect(isIdpIdir('thisismyidir')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isIdpIdir('AZUREIDIR')).toBe(true)
    expect(isIdpIdir('AzureIdir')).toBe(true)
  })
})
