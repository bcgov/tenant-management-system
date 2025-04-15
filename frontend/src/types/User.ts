import type { Role } from '@/types/Role'
import type { SsoUser } from '@/types/SsoUser'

// TODO make this into a class
export type User = {
  displayName: string
  email: string
  firstName: string
  lastName: string
  userName: string
  // TODO: this type should not have both Role and Role[]
  role?: Role
  roles: Role[]
  // TODO: should this type have both ssoUser and ssoUserId?
  ssoUser: SsoUser
  ssoUserId: string
}
