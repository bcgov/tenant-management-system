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
    id: string
    ssoUser: {
      displayName: string
      email: string
      firstName: string
      lastName: string
      userName: string
    }
    roles: []
  }): User {
    return new User(
      apiData.id,
      apiData.ssoUser.userName,
      apiData.ssoUser.firstName,
      apiData.ssoUser.lastName,
      apiData.ssoUser.displayName,
      apiData.ssoUser.email,
      apiData.roles.map(Role.fromApiData),
    )
  }

  // TODO: this abuses the id field - it should be the user id, not the sso id.
  // Figure out a cleaner way to handle this.
  static fromSearchData(searchData: {
    email: string
    firstName: string
    lastName: string
    attributes: {
      display_name: string[]
      idir_user_guid: string[]
      idir_username: string[]
    }
  }): User {
    return new User(
      searchData.attributes.idir_user_guid[0],
      searchData.attributes.idir_username[0],
      searchData.firstName,
      searchData.lastName,
      searchData.attributes.display_name[0],
      searchData.email,
      [], // Roles are not provided in search results
    )
  }
}
