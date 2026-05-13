import { describe, it, expect } from 'vitest'

import {
  IdentityProvider,
  identityProviderToDisplay,
  resolveIdentityProvider,
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
    expect(identityProviderToDisplay('bceidbasic')).toBe('BCeID')
  })

  it('converts bceidboth to BCeID display', () => {
    expect(identityProviderToDisplay('bceidboth')).toBe('BCeID')
  })

  it('converts bceidbusiness to BCeID display', () => {
    expect(identityProviderToDisplay('bceidbusiness')).toBe('BCeID')
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

describe('resolveIdentityProvider', () => {
  it('throws for empty string', () => {
    expect(() => resolveIdentityProvider('')).toThrow(
      'Unknown identity provider: ""',
    )
  })

  it('resolves azureidir to IDIR', () => {
    expect(resolveIdentityProvider('azureidir')).toBe(IdentityProvider.IDIR)
  })

  it('resolves bceidbasic to BCeID', () => {
    expect(resolveIdentityProvider('bceidbasic')).toBe(IdentityProvider.BCEID)
  })

  it('resolves bceidboth to BCeID', () => {
    expect(resolveIdentityProvider('bceidboth')).toBe(IdentityProvider.BCEID)
  })

  it('resolves bceidbusiness to BCeID', () => {
    expect(resolveIdentityProvider('bceidbusiness')).toBe(
      IdentityProvider.BCEID,
    )
  })

  it('resolves idir to IDIR', () => {
    expect(resolveIdentityProvider('idir')).toBe(IdentityProvider.IDIR)
  })

  it('is case-insensitive', () => {
    expect(resolveIdentityProvider('AZUREIDIR')).toBe(IdentityProvider.IDIR)
    expect(resolveIdentityProvider('AzureIdir')).toBe(IdentityProvider.IDIR)
  })

  it('throws for unrecognized IDP', () => {
    expect(() => resolveIdentityProvider('thisismyidir')).toThrow(
      'Unknown identity provider: "thisismyidir"',
    )
  })
})
