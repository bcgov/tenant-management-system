import type { User } from '@/types/User'
import { ROLES } from '@/utils/constants'

export class Tenancy {
  id: string
  name: string
  ministryName: string
  // TODO: this type should not have both User and User[]
  // user: User
  users: User[]

  constructor(id: string, name: string, ministryName: string, users: User[]) {
    this.id = id
    this.name = name
    this.ministryName = ministryName
    this.users = users
  }

  getAdminUsers(): User[] {
    return this.users.filter(
      (user) =>
        Array.isArray(user.roles) &&
        user.roles.some((role) => role.name === ROLES.ADMIN),
    )
  }
}
