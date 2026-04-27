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

  // Real IDPs
  it('converts azureidir to IDIR display', () => {
    expect(identityProviderToDisplay('azureidir')).toBe('IDIR')
  })

  it('converts bceidboth to BCeID display', () => {
    expect(identityProviderToDisplay('bceidboth')).toBe('BCeID')
  })

  it('converts bceidbusiness to BCeID display', () => {
    expect(identityProviderToDisplay('bceidbusiness')).toBe('BCeID')
  })

  // Possible but unused IDPs
  it('converts idir to IDIR display', () => {
    expect(identityProviderToDisplay('idir')).toBe('IDIR')
  })

  it('converts bceidbasic to BCeID display', () => {
    expect(identityProviderToDisplay('bceidbasic')).toBe('BCeID')
  })

  it('is case-insensitive', () => {
    expect(identityProviderToDisplay('AZUREIDIR')).toBe('IDIR')
    expect(identityProviderToDisplay('AzureIdir')).toBe('IDIR')
  })

  it('passes through unknown IDP as-is', () => {
    expect(identityProviderToDisplay('someunknownidp')).toBe('someunknownidp')
  })
})

describe('resolveIdentityProvider', () => {
  it('throws for undefined', () => {
    expect(() => resolveIdentityProvider(undefined)).toThrow(
      'identity provider is missing',
    )
  })

  it('throws for empty string', () => {
    expect(() => resolveIdentityProvider('')).toThrow(
      'identity provider is missing',
    )
  })

  // Real IDPs
  it('resolves azureidir to IDIR', () => {
    expect(resolveIdentityProvider('azureidir')).toBe(IdentityProvider.IDIR)
  })

  it('resolves bceidboth to BCeID', () => {
    expect(resolveIdentityProvider('bceidboth')).toBe(IdentityProvider.BCEID)
  })

  it('resolves bceidbusiness to BCeID', () => {
    expect(resolveIdentityProvider('bceidbusiness')).toBe(
      IdentityProvider.BCEID,
    )
  })

  // Possible but unused IDPs
  it('resolves idir to IDIR', () => {
    expect(resolveIdentityProvider('idir')).toBe(IdentityProvider.IDIR)
  })

  it('resolves bceidbasic to BCeID', () => {
    expect(resolveIdentityProvider('bceidbasic')).toBe(IdentityProvider.BCEID)
  })

  it('is case-insensitive', () => {
    expect(resolveIdentityProvider('AZUREIDIR')).toBe(IdentityProvider.IDIR)
    expect(resolveIdentityProvider('AzureIdir')).toBe(IdentityProvider.IDIR)
  })

  it('returns undefined for unrecognized IDP', () => {
    expect(resolveIdentityProvider('thisismyidir')).toBeUndefined()
  })
})
