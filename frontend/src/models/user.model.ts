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
}
