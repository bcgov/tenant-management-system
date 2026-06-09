import { ServiceRole, type ServiceRoleId } from '@/models/servicerole.model'

/**
 * The shape of the data that comes from the API.
 */
export type ServiceRoleApiData = {
  /**
   * Allowed identity providers.
   */
  allowedIdentityProviders: string[]

  /**
   * Created by for this service role.
   */
  createdBy: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when service role was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDateTime: string

  /**
   * Description of the service role.
   */
  description: string

  /**
   * Unique identifier for the service role.
   */
  id: ServiceRoleId

  /**
   * Whether or not the service role is deleted.
   */
  isDeleted: boolean

  /**
   * Name of the service role.
   */
  name: string
}

export const serviceRoleMapper = {
  /**
   * Creates a ServiceRole instance from API response data.
   *
   * @param apiData - The raw service role data from the API.
   * @returns A new ServiceRole instance.
   */
  fromApiData: (apiData: ServiceRoleApiData) => {
    return new ServiceRole(
      apiData.id,
      apiData.name,
      apiData.description,
      apiData.allowedIdentityProviders,
      apiData.createdBy,
      apiData.createdDateTime,
      apiData.isDeleted,
    )
  },
}
