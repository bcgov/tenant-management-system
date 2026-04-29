import { type SsoUserId } from '@/models/ssouser.model'
import { User, type UserApiData } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

export type TenantId = string & { readonly __brand: 'TenantId' }
export const toTenantId = (id: string): TenantId => id as TenantId

/**
 * The shape of the data that comes from the API.
 */
type TenantApiData = {
  /**
   * The UUID of who created the tenant.
   */
  createdBy: string

  /**
   * The username of who created the tenant, may be undefined.
   */
  createdByUserName?: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when tenant was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDateTime: string

  /**
   * Description of the tenant.
   */
  description: string

  /**
   * Unique identifier for the tenant.
   */
  id: TenantId

  /**
   * Associated ministry or organization name.
   */
  ministryName: string

  /**
   * Display name of the tenant.
   */
  name: string

  /**
   * Array of users associated with this tenant.
   */
  users: UserApiData[]
}

/**
 * Utility type that represents the subset of Tenant properties used in the form
 * that edits these fields.
 */
export type TenantDetailFields = Pick<
  Tenant,
  'description' | 'ministryName' | 'name'
>

/**
 * Represents a tenant in the system.
 */
export class Tenant {
  /**
   * The identity of who created the tenant.
   */
  createdBy: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when tenant was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

  /**
   * Description of the tenant.
   */
  description: string

  /**
   * Unique identifier for the tenant.
   */
  id: TenantId

  /**
   * Associated ministry or organization name.
   */
  ministryName: string

  /**
   * Display name of the tenant.
   */
  name: string

  /**
   * Array of users associated with this tenant.
   */
  users: User[]

  /**
   * Creates a new Tenant instance.
   *
   * @param createdBy - The identity of who created the tenant
   * @param createdDate - ISO8601 date string (YYYY-MM-DD) when tenant was
   *   created
   * @param description - Description of the tenant
   * @param id - Unique identifier for the tenant
   * @param name - Display name of the tenant
   * @param ministryName - Associated ministry or organization name
   * @param users - Array of users associated with this tenant
   */
  constructor(
    createdBy: string,
    createdDate: string,
    description: string,
    id: TenantId,
    name: string,
    ministryName: string,
    users: User[],
  ) {
    this.createdBy = createdBy
    this.createdDate = createdDate
    this.description = description
    this.id = id
    this.name = name
    this.ministryName = ministryName
    this.users = Array.isArray(users) ? users : []
  }

  /**
   * Finds a user in the tenant's users array by their SSO User ID.
   *
   * @param ssoUserId - The SSO User ID of the user to find
   * @returns The User if found, or undefined if not found
   */
  findUser(ssoUserId: SsoUserId): User | undefined {
    return this.users.find((user) => user.ssoUser.ssoUserId === ssoUserId)
  }

  /**
   * Creates a Tenant instance from API response data.
   *
   * Note: The API returns 'createdDateTime' which is mapped to the
   * 'createdDate' property.
   *
   * @param apiData - The raw tenant data from the API
   * @returns A new Tenant instance
   */
  static fromApiData(apiData: TenantApiData): Tenant {
    const users = Array.isArray(apiData.users)
      ? apiData.users.map(User.fromApiData)
      : []

    return new Tenant(
      apiData.createdByUserName || apiData.createdBy,
      apiData.createdDateTime,
      apiData.description,
      apiData.id,
      apiData.name,
      apiData.ministryName,
      users,
    )
  }

  /**
   * Returns the first user with the TENANT_OWNER role for this tenant.
   *
   * @returns The first User who is an owner, or undefined if no owners exist.
   */
  getFirstOwner(): User | undefined {
    return this.getOwners()[0]
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
   * @param user - The user to check
   * @param roleName - The name of the role to check for
   * @returns True if the user exists and has the role, false otherwise
   */
  userHasRole(user: User, roleName: string): boolean {
    const tenantUser = this.findUser(user.ssoUser.ssoUserId)

    return tenantUser
      ? tenantUser.roles.some((role) => role.name === roleName)
      : false
  }
}
