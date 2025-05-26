import { Role } from '@/models/role.model'
import { SsoUser } from '@/models/ssouser.model'

export class User {
  id: string
  displayName: string
  email: string
  firstName: string
  lastName: string
  userName: string
  roles: Role[]
  ssoUser: SsoUser

  constructor(
    id: string,
    userName: string,
    firstName: string,
    lastName: string,
    displayName: string,
    email: string,
    ssoUser: SsoUser,
    roles: Role[],
  ) {
    this.id = id
    this.displayName = displayName
    this.email = email
    this.firstName = firstName
    this.lastName = lastName
    this.userName = userName
    this.ssoUser = ssoUser
    this.roles = roles
  }

  static fromApiData(apiData: {
    id: string
    displayName: string
    email: string
    firstName: string
    lastName: string
    userName: string
    roles: Role[]
    ssoUser: SsoUser
  }): User {
    return new User(
      apiData.id,
      apiData.userName,
      apiData.firstName,
      apiData.lastName,
      apiData.displayName,
      apiData.email,
      apiData.ssoUser,
      apiData.roles,
    )
  }
}
