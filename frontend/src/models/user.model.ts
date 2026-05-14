import { Role, type RoleApiData } from '@/models/role.model'
import {
  SsoUser,
  type SsoUserApiData,
  toSsoUserId,
} from '@/models/ssouser.model'
import { isIdpBceid, isIdpIdir } from '@/utils/identityProvider'

export type UserId = string & { readonly __brand: 'UserId' }
export const toUserId = (id: string): UserId => id as UserId

/**
 * The shape of the data that comes from the API.
 */
export type UserApiData = {
  /**
   * Unique identifier for the user.
   */
  id: UserId

  /**
   * SSO user details.
   */
  ssoUser: SsoUserApiData

  /**
   * Array of roles assigned to the user, which may be undefined.
   */
  roles?: RoleApiData[]
}

/**
 * The shape of the data that comes from the API.
 */
export type UserSearchApiData = {
  /**
   * Additional attributes that may be returned by the SSO API, and can be
   * inconsistent in key casing and presence. For example, the username might be
   * under the key 'bceid_username' or 'idir_username', or may not be present at
   * all.
   */
  attributes: {
    [key: string]: string[] | undefined
  }

  /**
   * Email address of the user.
   */
  email: string

  /**
   * First name of the user.
   */
  firstName: string

  /**
   * Last name of the user.
   */
  lastName: string

  /**
   * Optional username of the user.
   */
  username?: string
}

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
   * @param id - Unique identifier for the user
   * @param ssoUser - The associated SSO user details
   * @param roles - Array of roles assigned to the user (default empty array)
   */
  constructor(id: UserId, ssoUser: SsoUser, roles: Role[] = []) {
    this.id = id
    this.roles = roles
    this.ssoUser = ssoUser
  }

  /**
   * Creates a User instance from API response data.
   *
   * @param apiData - The raw user data from the API
   * @returns A new User instance
   */
  static fromApiData(apiData: UserApiData): User {
    const roles = Array.isArray(apiData.roles)
      ? apiData.roles.map(Role.fromApiData)
      : []
    const ssoUser = SsoUser.fromApiData(apiData.ssoUser)
    const userId = apiData.id

    return new User(userId, ssoUser, roles)
  }

  /**
   * Creates a User instance from search result data.
   *
   * Note: The SSO API search results might be incomplete or inconsistent.
   * This method attempts to handle missing fields gracefully, but if the
   * username is undefined it could cause issues.
   *
   * @param searchData - The raw user search data
   * @returns A new User instance with no roles (roles are not provided in
   *   search results)
   */
  static fromSearchData(searchData: UserSearchApiData): User {
    // The SSO API doesn't always return the expected fields - try to be lenient
    // but note that if the username is undefined then it will cause issues.
    const attributes = searchData.attributes
    const type = attributes.idir_username?.[0]
      ? 'idir'
      : attributes.bceid_business_guid?.[0]
        ? 'bceidbusiness'
        : 'bceidbasic'
    const userId = toSsoUserId(
      attributes.idir_user_guid?.[0] ??
        attributes.idir_userid?.[0] ??
        attributes.bceid_user_guid?.[0] ??
        attributes.bceid_userid?.[0] ??
        '',
    )
    const username =
      attributes.idir_username?.[0] ??
      attributes.bceid_username?.[0] ??
      undefined
    const displayName =
      attributes.display_name?.[0] ?? attributes.displayName?.[0] ?? ''

    const ssoUser = new SsoUser(
      userId,
      username,
      searchData.firstName,
      searchData.lastName,
      displayName,
      searchData.email,
      type,
    )

    return new User(
      // We don't know the user ID, so duplicate the SsoUserId
      toUserId(userId),
      ssoUser,
      // Roles are not provided in search results
      [],
    )
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
