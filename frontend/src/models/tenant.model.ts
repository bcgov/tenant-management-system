import { User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

export class Tenant {
  createdBy: string
  createdDateTime: Date
  description: string
  id: string
  name: string
  ministryName: string
  users: User[]

  constructor(
    createdBy: string,
    createdDateTime: Date,
    description: string,
    id: string,
    name: string,
    ministryName: string,
    users: User[],
  ) {
    this.createdBy = createdBy
    this.createdDateTime = createdDateTime
    this.description = description
    this.id = id
    this.name = name
    this.ministryName = ministryName
    this.users = users
  }

  static fromApiData(apiData: {
    createdBy: string
    createdDateTime: string
    description: string
    id: string
    name: string
    ministryName: string
    users: any[]
  }): Tenant {
    const users = apiData.users?.map(User.fromApiData)

    return new Tenant(
      apiData.createdBy,
      new Date(apiData.createdDateTime),
      apiData.description,
      apiData.id,
      apiData.name,
      apiData.ministryName,
      users,
    )
  }

  getOwners(): User[] {
    return this.users.filter(
      (user) =>
        Array.isArray(user.roles) &&
        user.roles.some((role) => role.name === ROLES.TENANT_OWNER),
    )
  }
}
