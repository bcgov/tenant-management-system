import { Role } from '@/models/role.model'
import { SsoUser } from '@/models/ssouser.model'

export class User {
  id: string
  roles: Role[]
  ssoUser: SsoUser

  constructor(id: string, ssoUser: SsoUser, roles: Role[] = []) {
    this.id = id
    this.roles = Array.isArray(roles) ? roles : []
    this.ssoUser = ssoUser
  }

  static fromApiData(apiData: {
    id: string
    ssoUser: SsoUser
    roles?: any[]
  }): User {
    const roles = Array.isArray(apiData.roles)
      ? apiData.roles.map(Role.fromApiData)
      : []
    const ssoUser = SsoUser.fromApiData(apiData.ssoUser)

    return new User(apiData.id, ssoUser, roles)
  }

  static fromSearchData(searchData: {
    email: string
    firstName: string
    lastName: string
    attributes: {
      [key: string]: string[] | undefined
    }
  }): User {
    // The SSO API doesn't always return the expected fields - try to be lenient
    // but note that if the username is undefined then it will cause issues.
    const attributes = searchData.attributes
    const userId =
      attributes.idir_user_guid?.[0] ?? attributes.idir_userid?.[0] ?? ''
    const username = attributes.idir_username?.[0]
    const displayName =
      attributes.display_name?.[0] ?? attributes.displayName?.[0] ?? ''

    const ssoUser = new SsoUser(
      userId,
      username,
      searchData.firstName,
      searchData.lastName,
      displayName,
      searchData.email,
    )

    return new User(
      userId,
      ssoUser,
      [], // Roles are not provided in search results
    )
  }
}
