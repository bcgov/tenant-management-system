import type { User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

export class Tenant {
  id: string
  name: string
  ministryName: string
  users: User[]

  constructor(id: string, name: string, ministryName: string, users: User[]) {
    this.id = id
    this.name = name
    this.ministryName = ministryName
    this.users = users
  }

  static fromApiData(apiData: {
    id: string
    name: string
    ministryName: string
  }): Tenant {
    return new Tenant(apiData.id, apiData.name, apiData.ministryName, [])
  }

  getAdminUsers(): User[] {
    return this.users.filter(
      (user) =>
        Array.isArray(user.roles) &&
        user.roles.some((role) => role.name === ROLES.ADMIN),
    )
  }
}
