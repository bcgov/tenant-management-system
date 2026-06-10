import {
  serviceRoleMapper,
  type ServiceRoleApiData,
} from '@/mappers/servicerole.mapper'
import { Service, type ServiceId } from '@/models/service.model'

/**
 * The shape of the data that comes from the API.
 */
export type ServiceApiData = {
  /**
   * The client identifier for the service.
   */
  clientIdentifier: string

  /**
   * The ISO8601 date string (YYYY-MM-DD) when service was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDateTime: string

  /**
   * The description of the service.
   */
  description: string

  /**
   * The display name of the service.
   */
  displayName: string

  /**
   * The unique identifier for the service.
   */
  id: ServiceId

  /**
   * The URL for the landing page of the service.
   */
  landingPageUrl: string

  /**
   * The name of the service.
   */
  name: string

  /**
   * The roles available in the service.
   */
  roles: ServiceRoleApiData[]

  /**
   * The ISO8601 date string (YYYY-MM-DD) when service was last updated.
   *
   * Note: This maps to 'updatedDate' in the model.
   */
  updatedDateTime: string
}

export const serviceMapper = {
  /**
   * Creates a Service instance from API response data.
   *
   * Note: The API returns 'createdDateTime' which is mapped to the
   * 'createdDate' property.
   *
   * @param apiData - The raw service data from the API.
   * @returns A new Service instance.
   */
  fromApiData: (apiData: ServiceApiData) => {
    const roles = apiData.roles.map(serviceRoleMapper.fromApiData)

    return new Service(
      apiData.id,
      apiData.name,
      apiData.displayName,
      apiData.createdDateTime,
      apiData.clientIdentifier,
      apiData.landingPageUrl,
      apiData.description,
      apiData.updatedDateTime,
      roles,
    )
  },
}
