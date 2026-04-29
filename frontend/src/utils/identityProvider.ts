export enum IdentityProvider {
  BCEID = 'BCeID',
  IDIR = 'IDIR',
}

const IDP_TOKEN_MAP: Record<string, IdentityProvider> = {
  azureidir: IdentityProvider.IDIR,
  bceidbasic: IdentityProvider.BCEID,
  bceidboth: IdentityProvider.BCEID,
  bceidbusiness: IdentityProvider.BCEID,
  idir: IdentityProvider.IDIR,
}

export const identityProviderToDisplay = (
  idpType: string | undefined,
): string => {
  if (!idpType) {
    return ''
  }

  return IDP_TOKEN_MAP[idpType.toLowerCase()] ?? idpType
}

export const resolveIdentityProvider = (
  idp: string | undefined,
): IdentityProvider | undefined => {
  if (!idp) {
    throw new Error(`Error: identity provider is missing`)
  }

  return IDP_TOKEN_MAP[idp.toLowerCase()]
}
