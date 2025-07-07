import { Role } from '@/models/role.model'

export class User {
  displayName: string
  email?: string
  firstName: string
  id: string
  lastName: string
  roles: Role[]
  userName?: string

  constructor(
    id: string,
    userName: string | undefined,
    firstName: string,
    lastName: string,
    displayName: string,
    email: string | undefined,
    roles: Role[] = [], // Default to empty array
  ) {
    this.id = id
    this.displayName = displayName
    this.email = email
    this.firstName = firstName
    this.lastName = lastName
    this.userName = userName
    this.roles = Array.isArray(roles) ? roles : []
  }

  static fromApiData(apiData: {
    id: string
    ssoUser: {
      displayName: string
      email: string
      firstName: string
      lastName: string
      userName: string
    }
    roles?: any[]
  }): User {
    const roles = Array.isArray(apiData.roles)
      ? apiData.roles.map(Role.fromApiData)
      : []

    return new User(
      apiData.id,
      apiData.ssoUser.userName,
      apiData.ssoUser.firstName,
      apiData.ssoUser.lastName,
      apiData.ssoUser.displayName,
      apiData.ssoUser.email,
      roles,
    )
  }

  // TODO: this abuses the id field - it should be the user id, not the sso id.
  // Figure out a cleaner way to handle this.
  static fromSearchData(searchData: {
    email: string
    firstName: string
    lastName: string
    attributes: {
      [key: string]: string[] | undefined
    }
  }): User {
    // The SSO API doesn't always return the expected fields - try to be lenient
    // but if the username is undefined then it will cause issues.
    const attributes = searchData.attributes
    const userId =
      attributes.idir_user_guid?.[0] ?? attributes.idir_userid?.[0] ?? ''
    const username = attributes.idir_username?.[0]
    const displayName =
      attributes.display_name?.[0] ?? attributes.displayName?.[0] ?? ''

    return new User(
      userId,
      username,
      searchData.firstName,
      searchData.lastName,
      displayName,
      searchData.email,
      [], // Roles are not provided in search results,
    )
  }
}
