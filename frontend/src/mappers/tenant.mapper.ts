import { type UserApiData, userMapper } from '@/mappers/user.mapper'
import { Tenant, type TenantId } from '@/models/tenant.model'

/**
 * The shape of the data that comes from the API.
 */
export type TenantApiData = {
  /**
   * The UUID of who created the tenant.
   */
  createdBy: string

  /**
   * The display name of who created the tenant, may be undefined.
   */
  createdByDisplayName?: string

  /**
   * The ISO8601 date string (YYYY-MM-DD) when tenant was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDateTime: string

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
  users: UserApiData[]
}

export const tenantMapper = {
  /**
   * Creates a Tenant instance from API response data.
   *
   * Note: The API returns 'createdDateTime' which is mapped to the
   * 'createdDate' property.
   *
   * Note: The API may return 'createdByDisplayName', in which case it is used
   * in preference to the createdBy UUID.
   *
   * @param apiData - The raw tenant data from the API.
   * @returns A new Tenant instance.
   */
  fromApiData: (apiData: TenantApiData): Tenant => {
    const users = apiData.users.map(userMapper.fromApiData)

    return new Tenant({
      createdBy: apiData.createdByDisplayName || apiData.createdBy,
      createdDate: apiData.createdDateTime,
      description: apiData.description,
      id: apiData.id,
      ministryName: apiData.ministryName,
      name: apiData.name,
      users,
    })
  },
}
