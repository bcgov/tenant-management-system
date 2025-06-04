import { User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

/**
 * Represents a tenant in the system.
 */
export class Tenant {
  /**
   * The username of who created the tenant.
   */
  createdBy: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when tenant was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

  /**
   * Optional description of the tenant.
   */
  description: string

  /**
   * Unique identifier for the tenant.
   */
  id: string

  /**
   * Display name of the tenant.
   */
  name: string

  /**
   * Associated ministry or organization name.
   */
  ministryName: string

  /**
   * Array of users associated with this tenant.
   */
  users: User[]

  /**
   * Creates a new Tenant instance.
   *
   * @param createdBy - The username of who created the tenant
   * @param createdDate - ISO8601 date string (YYYY-MM-DD) when tenant was created
   * @param description - Optional description of the tenant
   * @param id - Unique identifier for the tenant
   * @param name - Display name of the tenant
   * @param ministryName - Associated ministry or organization name
   * @param users - Array of users associated with this tenant
   */
  constructor(
    createdBy: string,
    createdDate: string,
    description: string,
    id: string,
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
    this.users = users
  }

  /**
   * Creates a Tenant instance from API response data.
   *
   * Note: The API returns 'createdDateTime' which is mapped to the
   * 'createdDate' property.
   *
   * @param apiData - The raw tenant data from the API
   * @param apiData.createdBy - The username of who created the tenant
   * @param apiData.createdDateTime - ISO8601 date string (YYYY-MM-DD) when
   *     tenant was created
   * @param apiData.description - Optional description of the tenant
   * @param apiData.id - Unique identifier for the tenant
   * @param apiData.name - Display name of the tenant
   * @param apiData.ministryName - Associated ministry or organization name
   * @param apiData.users - Array of raw user objects to be converted
   * @returns A new Tenant instance
   */
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
      apiData.createdDateTime,
      apiData.description,
      apiData.id,
      apiData.name,
      apiData.ministryName,
      users,
    )
  }

  /**
   * Gets all users with the TENANT_OWNER role for this tenant.
   *
   * @returns An array of Users who are owners. Returns empty array if:
   *   - users property is not an array
   *   - no users have the TENANT_OWNER role
   *   - users don't have a roles array
   */
  getOwners(): User[] {
    if (!Array.isArray(this.users)) {
      return []
    }

    return this.users.filter(
      (user) =>
        Array.isArray(user.roles) &&
        user.roles.some((role) => role.name === ROLES.TENANT_OWNER),
    )
  }
}
