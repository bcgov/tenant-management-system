export type SsoUserId = string & { readonly __brand: 'SSOUserId' }
export const toSsoUserId = (id: string): SsoUserId => id as SsoUserId

/**
 * Configuration options required to instantiate a SsoUser.
 */
export type SsoUserConfig = {
  displayName: string
  email?: string
  firstName: string
  idpType: string
  lastName: string
  ssoUserId: SsoUserId
  userName?: string
}

/**
 * Represents a single SSO user.
 */
export class SsoUser {
  /**
   * The display name of the user.
   */
  displayName: string

  /**
   * The user's email address (optional).
   */
  email?: string

  /**
   * The user's first name.
   */
  firstName: string

  /**
   * The identity provider for the SSO user.
   */
  idpType: string

  /**
   * The user's last name.
   */
  lastName: string

  /**
   * The unique identifier for the user in the SSO system.
   */
  ssoUserId: SsoUserId

  /**
   * The user's username (optional).
   */
  userName?: string

  /**
   * Creates a new SsoUser instance.
   *
   * @param config - The configuration properties for the SSO user.
   * @returns A new SsoUser instance.
   */
  constructor(config: SsoUserConfig) {
    this.displayName = config.displayName
    this.email = config.email
    this.firstName = config.firstName
    this.idpType = config.idpType
    this.lastName = config.lastName
    this.ssoUserId = config.ssoUserId
    this.userName = config.userName
  }
}
