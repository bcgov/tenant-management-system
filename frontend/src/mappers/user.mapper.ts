import { type RoleApiData, roleMapper } from '@/mappers/role.mapper'
import { ssoUserMapper, type SsoUserApiData } from '@/mappers/ssouser.mapper'
import { SsoUser, toSsoUserId } from '@/models/ssouser.model'
import { User, type UserId, toUserId } from '@/models/user.model'

/**
 * The shape of the data that comes from the API.
 */
export type UserApiData = {
  /**
   * Unique identifier for the user.
   */
  id: UserId

  /**
   * The roles assigned to the user, which may be undefined.
   */
  roles?: RoleApiData[]

  /**
   * SSO user details.
   */
  ssoUser: SsoUserApiData
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
}

export const userMapper = {
  /**
   * Creates a User instance from API response data.
   *
   * @param apiData - The raw user data from the API.
   * @returns A new User instance.
   */
  fromApiData: (apiData: UserApiData): User => {
    const roles = Array.isArray(apiData.roles)
      ? apiData.roles.map(roleMapper.fromApiData)
      : []
    const ssoUser = ssoUserMapper.fromApiData(apiData.ssoUser)
    const userId = apiData.id

    return new User({ id: userId, roles, ssoUser: ssoUser })
  },

  /**
   * Creates a User instance from search result data.
   *
   * Note: The SSO API search results might be incomplete or inconsistent.
   * This method attempts to handle missing fields gracefully, but if the
   * username is undefined it could cause issues.
   *
   * @param searchData - The raw user search data.
   * @returns A new User instance with no roles (roles are not provided in
   *   search results).
   */
  fromSearchData: (searchData: UserSearchApiData): User => {
    const attributes = searchData.attributes
    const displayName = attributes.display_name?.[0] ?? ''
    const idpType = attributes.idir_username?.[0] ? 'idir' : 'bceidbusiness'
    const ssoUserId = toSsoUserId(
      attributes.idir_user_guid?.[0] ?? attributes.bceid_user_guid?.[0] ?? '',
    )
    const username =
      attributes.idir_username?.[0] ??
      attributes.bceid_username?.[0] ??
      undefined

    const ssoUser = new SsoUser({
      displayName,
      email: searchData.email,
      firstName: searchData.firstName,
      idpType,
      lastName: searchData.lastName,
      ssoUserId,
      userName: username,
    })

    // The User ID and roles are not provided in search results
    return new User({
      id: toUserId(''),
      roles: [],
      ssoUser: ssoUser,
    })
  },
}
