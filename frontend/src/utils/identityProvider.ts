/**
 * There are two classes of identity providers: IDIR and BCeID, which includes
 * both Basic BCeID and Business BCeID.
 */
export enum IdentityProvider {
  BCEID = 'BCeID',
  IDIR = 'IDIR',
}

/**
 * Maps Keycloak identity provider values to the `IdentityProvider` enum.
 */
const IDP_TOKEN_MAP: Record<string, IdentityProvider> = {
  azureidir: IdentityProvider.IDIR,
  bceidbasic: IdentityProvider.BCEID,
  bceidboth: IdentityProvider.BCEID,
  bceidbusiness: IdentityProvider.BCEID,
  idir: IdentityProvider.IDIR,
}

/**
 * Gets the user-friendly display name (such as 'IDIR') for a given identity
 * provider string (such as 'azureidir'). If undefined will return an empty
 * string, and if the string isn't recognized will return the input string
 * as-is.
 *
 * @param idpType - the raw identity provider string from the token.
 * @returns The user-friendly display name for the identity provider.
 */
export const identityProviderToDisplay = (
  idpType: string | undefined,
): string => {
  if (!idpType) {
    return ''
  }

  return IDP_TOKEN_MAP[idpType.toLowerCase()] ?? idpType
}

/**
 * Gets the `IdentityProvider` enum value corresponding to a given identity
 * provider string from the token (such as 'azureidir').
 *
 * @param idp - the raw identity provider string from the token.
 * @returns The `IdentityProvider` enum value.
 * @throws Error if the input string is empty or doesn't correspond to a known
 *   identity provider.
 */
export const resolveIdentityProvider = (idp: string): IdentityProvider => {
  const resolved = IDP_TOKEN_MAP[idp.toLowerCase()]
  if (!resolved) {
    throw new Error(`Unknown identity provider: "${idp}"`)
  }

  return resolved
}
