export type SsoUserId = string & { readonly __brand: 'SSOUserId' }
export const toSsoUserId = (id: string): SsoUserId => id as SsoUserId

/**
 * The shape of the data that comes from the API.
 */
export type SsoUserApiData = {
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
  idpType?: string

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
  idpType?: string

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
   * @param ssoUserId - The unique SSO user ID
   * @param userName - The username (optional)
   * @param firstName - The user's first name
   * @param lastName - The user's last name
   * @param displayName - The display name of the user
   * @param email - The user's email address (optional)
   * @param idpType - The identity provider type (optional)
   */
  constructor(
    ssoUserId: SsoUserId,
    userName: string | undefined,
    firstName: string,
    lastName: string,
    displayName: string,
    email: string | undefined,
    idpType: string | undefined,
  ) {
    this.displayName = displayName
    this.email = email
    this.firstName = firstName
    this.idpType = idpType
    this.lastName = lastName
    this.ssoUserId = ssoUserId
    this.userName = userName
  }

  /**
   * Creates a SsoUser instance from API response data.
   *
   * @param apiData - The raw user data from the API
   * @returns A new SsoUser instance
   */
  static fromApiData(apiData: SsoUserApiData): SsoUser {
    return new SsoUser(
      apiData.ssoUserId,
      apiData.userName,
      apiData.firstName,
      apiData.lastName,
      apiData.displayName,
      apiData.email,
      apiData.idpType,
    )
  }
}
