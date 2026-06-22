import { SsoUser, type SsoUserId } from '@/models/ssouser.model'

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
}

export const ssoUserMapper = {
  /**
   * Creates a SsoUser instance from API response data.
   *
   * @param apiData - The raw user data from the API.
   * @returns A new SsoUser instance.
   */
  fromApiData: (apiData: SsoUserApiData): SsoUser => {
    return new SsoUser({
      displayName: apiData.displayName,
      email: apiData.email,
      firstName: apiData.firstName,
      idpType: apiData.idpType,
      lastName: apiData.lastName,
      ssoUserId: apiData.ssoUserId,
      userName: apiData.userName,
    })
  },
}
