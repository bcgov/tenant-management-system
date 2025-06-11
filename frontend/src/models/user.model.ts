import { Role } from '@/models/role.model'

export class User {
  id: string
  displayName: string
  email: string
  firstName: string
  lastName: string
  userName: string
  roles: Role[]

  constructor(
    id: string,
    userName: string,
    firstName: string,
    lastName: string,
    displayName: string,
    email: string,
    roles: Role[],
  ) {
    this.id = id
    this.displayName = displayName
    this.email = email
    this.firstName = firstName
    this.lastName = lastName
    this.userName = userName
    this.roles = roles
  }

  static fromApiData(apiData: {
    ssoUser: {
      displayName: string
      email: string
      firstName: string
      lastName: string
      ssoUserId: string
      userName: string
    }
    roles: []
  }): User {
    return new User(
      apiData.ssoUser.ssoUserId,
      apiData.ssoUser.userName,
      apiData.ssoUser.firstName,
      apiData.ssoUser.lastName,
      apiData.ssoUser.displayName,
      apiData.ssoUser.email,
      apiData.roles.map(Role.fromApiData),
    )
  }

  static fromSearchData(searchData: {
    email: string
    firstName: string
    lastName: string
    attributes: {
      display_name: string[]
      idir_user_guid: string[]
    }
  }): User {
    return new User(
      searchData.attributes.idir_user_guid[0],
      '', // IDIR username is not provided in search results
      searchData.firstName,
      searchData.lastName,
      searchData.attributes.display_name[0],
      searchData.email,
      [], // Roles are not provided in search results
    )
  }
}
