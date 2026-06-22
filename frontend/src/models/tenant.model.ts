import { type SsoUserId } from '@/models/ssouser.model'
import { User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

export type TenantId = string & { readonly __brand: 'TenantId' }
export const toTenantId = (id: string): TenantId => id as TenantId

/**
 * Utility type that represents the subset of Tenant properties used in the form
 * that edits these fields.
 */
export type TenantDetailFields = Pick<
  Tenant,
  'description' | 'ministryName' | 'name'
>

/**
 * Configuration options required to instantiate a Tenant.
 */
export type TenantConfig = {
  createdBy: string
  createdDate: string
  description: string
  id: TenantId
  ministryName: string
  name: string
  users: User[]
}

/**
 * Represents a tenant in the system.
 */
export class Tenant {
  /**
   * The identity of who created the tenant.
   */
  createdBy: string

  /**
   * The ISO8601 date string (YYYY-MM-DD) when tenant was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

  /**
   * The description of the tenant.
   */
  description: string

  /**
   * The unique identifier for the tenant.
   */
  id: TenantId

  /**
   * The associated ministry or organization name.
   */
  ministryName: string

  /**
   * The display name of the tenant.
   */
  name: string

  /**
   * The users associated with this tenant.
   */
  users: User[]

  /**
   * Creates a new Tenant instance.
   *
   * @param config - The configuration properties for the tenant.
   * @returns A new Tenant instance.
   */
  constructor(config: TenantConfig) {
    this.createdBy = config.createdBy
    this.createdDate = config.createdDate
    this.description = config.description
    this.id = config.id
    this.name = config.name
    this.ministryName = config.ministryName
    this.users = config.users
  }

  /**
   * Finds a user in the tenant's users array by their SSO User ID.
   *
   * @param ssoUserId - The SSO User ID of the user to find.
   * @returns The User if found, or undefined if not found.
   */
  findUser(ssoUserId: SsoUserId): User | undefined {
    return this.users.find((user) => user.ssoUser.ssoUserId === ssoUserId)
  }

  /**
   * Returns all users with the TENANT_OWNER role for this tenant.
   *
   * @returns An array of Users who are owners. Returns an empty array if no
   *   users have the TENANT_OWNER role.
   */
  getOwners(): User[] {
    return this.users.filter((user) =>
      user.roles.some((role) => role.name === ROLES.TENANT_OWNER.value),
    )
  }

  /**
   * Checks if a user has a specific role within this tenant.
   *
   * @param user - The user to check.
   * @param roleName - The name of the role to check for.
   * @returns True if the user exists and has the role, false otherwise.
   */
  userHasRole(user: User, roleName: string): boolean {
    const tenantUser = this.findUser(user.ssoUser.ssoUserId)

    return tenantUser
      ? tenantUser.roles.some((role) => role.name === roleName)
      : false
  }
}
