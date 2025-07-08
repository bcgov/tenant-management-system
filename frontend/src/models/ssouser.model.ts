export class SsoUser {
  displayName: string
  email?: string
  firstName: string
  lastName: string
  ssoUserId: string
  userName?: string

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
    this.ssoUserId = ssoUserId
  }

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
