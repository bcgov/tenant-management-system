import { Role } from '@/models/role.model'
import { SsoUser } from '@/models/ssouser.model'
import { isIdpBceidBusiness, isIdpIdir } from '@/utils/identityProvider'

export type UserId = string & { readonly __brand: 'UserId' }
export const toUserId = (id: string): UserId => id as UserId

/**
 * Configuration options required to instantiate a Service.
 */
export type UserConfig = {
  id: UserId
  roles: Role[]
  ssoUser: SsoUser
}

/**
 * Represents a user in the system.
 */
export class User {
  /**
   * The unique identifier for the user.
   */
  id: UserId

  /**
   * The roles assigned to the user.
   */
  roles: Role[]

  /**
   * The SSO user details.
   */
  ssoUser: SsoUser

  /**
   * Creates a new User instance.
   *
   * @param config - The configuration properties for the user.
   * @returns A new User instance.
   */
  constructor(config: UserConfig) {
    this.id = config.id
    this.roles = config.roles
    this.ssoUser = config.ssoUser
  }

  /**
   * Gets whether or not this user is a business BCeID user.
   *
   * @returns true if a BCeID user, false otherwise.
   */
  isBceid(): boolean {
    return isIdpBceidBusiness(this.ssoUser.idpType)
  }

  /**
   * Gets whether or not this user is an IDIR (azureidir or idir) user.
   *
   * @returns true if an IDIR user, false otherwise.
   */
  isIdir(): boolean {
    return isIdpIdir(this.ssoUser.idpType)
  }
}
