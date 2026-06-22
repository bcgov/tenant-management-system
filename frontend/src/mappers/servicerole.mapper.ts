import { ServiceRole, type ServiceRoleId } from '@/models/servicerole.model'

/**
 * The shape of the data that comes from the API.
 */
export type ServiceRoleApiData = {
  /**
   * The allowed identity providers.
   */
  allowedIdentityProviders: string[]

  /**
   * The user who created this service role.
   */
  createdBy: string

  /**
   * The ISO8601 date string (YYYY-MM-DD) when service role was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDateTime: string

  /**
   * The description of the service role.
   */
  description: string

  /**
   * The unique identifier for the service role.
   */
  id: ServiceRoleId

  /**
   * The enabled status of the service role.
   */
  isDeleted: boolean

  /**
   * The name of the service role.
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
    return new ServiceRole({
      createdBy: apiData.createdBy,
      createdDate: apiData.createdDateTime,
      description: apiData.description,
      id: apiData.id,
      identityProviders: apiData.allowedIdentityProviders,
      isDeleted: apiData.isDeleted,
      name: apiData.name,
    })
  },
}
