import { Role } from '@/models/role.model'
import { SsoUser } from '@/models/ssouser.model'
import { isIdpBceid, isIdpIdir } from '@/utils/identityProvider'

export type UserId = string & { readonly __brand: 'UserId' }
export const toUserId = (id: string): UserId => id as UserId

/**
 * Represents a user in the system.
 */
export class User {
  /**
   * Unique identifier for the user.
   */
  id: UserId

  /**
   * Array of roles assigned to the user.
   */
  roles: Role[]

  /**
   * SSO user details.
   */
  ssoUser: SsoUser

  /**
   * Creates a new User instance.
   *
   * @param id - Unique identifier for the user.
   * @param ssoUser - The associated SSO user details.
   * @param roles - Array of roles assigned to the user (default empty array).
   */
  constructor(id: UserId, ssoUser: SsoUser, roles: Role[] = []) {
    this.id = id
    this.roles = roles
    this.ssoUser = ssoUser
  }

  /**
   * Gets whether or not this user is a BCeID (basic or business) user.
   *
   * @returns true if a BCeID user, false otherwise.
   */
  isBceid(): boolean {
    return isIdpBceid(this.ssoUser.idpType)
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
