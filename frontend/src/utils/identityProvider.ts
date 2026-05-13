/**
 * There are two broad classes of identity providers that are supported: BCeID
 * and IDIR.
 */
const bceidBasicIdps = new Set(['bceidbasic'])
const bceidBusinessIdps = new Set(['bceidbusiness'])
const bceidIdps = new Set(['bceidbasic', 'bceidbusiness'])
const idirIdps = new Set(['azureidir', 'idir'])

/**
 * Gets the user-friendly display name (such as 'IDIR') for a given identity
 * provider string (such as 'azureidir'). If undefined will return an empty
 * string, and if the string isn't recognized will return the input string
 * as-is.
 *
 * @param idp - the raw identity provider string from the token.
 * @returns The user-friendly display name for the identity provider.
 */
export const identityProviderToDisplay = (idp: string | undefined): string => {
  if (idp && bceidBasicIdps.has(idp.toLowerCase())) {
    return 'Basic BCeID'
  }

  if (idp && bceidBusinessIdps.has(idp.toLowerCase())) {
    return 'Business BCeID'
  }

  if (isIdpIdir(idp)) {
    return 'IDIR'
  }

  return idp ?? ''
}

/**
 * Gets the whether or not the user's identity provider corresponds to an
 * identity provider that is BCeID ('bceidbasic', 'bceidboth' or
 * 'bceidbusiness').
 *
 * @param idp - the raw identity provider string from the token.
 * @returns true if the identity provider is a BCeID IdP
 */
export const isIdpBceid = (idp: string | undefined): boolean => {
  if (!idp) {
    return false
  }

  return bceidIdps.has(idp.toLowerCase())
}

/**
 * Gets the whether or not the user's identity provider corresponds to an
 * identity provider that is IDIR ('azureidir' or 'idir').
 *
 * @param idp - the raw identity provider string from the token.
 * @returns true if the identity provider is an IDIR IdP
 */
export const isIdpIdir = (idp: string | undefined): boolean => {
  if (!idp) {
    return false
  }

  return idirIdps.has(idp.toLowerCase())
}
