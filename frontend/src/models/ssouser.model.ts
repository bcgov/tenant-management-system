enum SSOUserIdEnum {
  _ = '',
}
declare type SSOUserId = string & SSOUserIdEnum

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
   * The user's last name.
   */
  lastName: string

  /**
   * The unique identifier for the user in the SSO system.
   */
  ssoUserId: SSOUserId

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
   */
  constructor(
    ssoUserId: string,
    userName: string | undefined,
    firstName: string,
    lastName: string,
    displayName: string,
    email: string | undefined,
  ) {
    this.displayName = displayName
    this.email = email
    this.firstName = firstName
    this.lastName = lastName
    this.userName = userName
    this.ssoUserId = ssoUserId as SSOUserId
  }

  /**
   * Creates a SsoUser instance from API response data.
   *
   * @param apiData - The raw user data from the API
   * @param apiData.displayName - The display name of the user
   * @param apiData.email - The user's email address (optional)
   * @param apiData.firstName - The user's first name
   * @param apiData.lastName - The user's last name
   * @param apiData.userName - The user's username (optional)
   * @param apiData.ssoUserId - The unique SSO user ID
   * @returns A new SsoUser instance
   */
  static fromApiData(apiData: {
    displayName: string
    email?: string
    firstName: string
    lastName: string
    userName?: string
    ssoUserId: string
  }): SsoUser {
    return new SsoUser(
      apiData.ssoUserId,
      apiData.userName,
      apiData.firstName,
      apiData.lastName,
      apiData.displayName,
      apiData.email,
    )
  }
}
