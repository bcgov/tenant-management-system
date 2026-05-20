import {
  ServiceRole,
  type ServiceRoleApiData,
} from '@/models/servicerole.model'

export type ServiceId = string & { readonly __brand: 'ServiceId' }
export const toServiceId = (id: string): ServiceId => id as ServiceId

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
   * The roles available in the service.
   */
  roles: ServiceRoleApiData[]
}

export class Service {
  /**
   * The client identifier for the service.
   */
  clientIdentifier: string

  /**
   * The ISO8601 date string (YYYY-MM-DD) when service was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

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
   * The roles in available in the service.
   */
  roles: ServiceRole[]

  /**
   * Creates a new Service instance.
   *
   * @param id - The unique identifier for the service
   * @param displayName - The display name of the service
   * @param createdDate - The ISO8601 date string (YYYY-MM-DD) when service was
   *   created
   * @param clientIdentifier - The client identifier for the service
   * @param description - The description of the service
   * @param roles - The roles in available in the service
   * @returns A new Service instance
   */
  constructor(
    id: ServiceId,
    displayName: string,
    createdDate: string,
    clientIdentifier: string,
    description: string,
    roles: ServiceRole[],
  ) {
    this.clientIdentifier = clientIdentifier
    this.createdDate = createdDate
    this.description = description
    this.displayName = displayName
    this.id = id
    this.roles = roles
  }

  /**
   * Creates a Service instance from API response data.
   *
   * Note: The API returns 'createdDateTime' which is mapped to the
   * 'createdDate' property.
   *
   * @param apiData - The raw service data from the API
   * @returns A new Service instance
   */
  static fromApiData(apiData: ServiceApiData): Service {
    const roles = apiData.roles.map(ServiceRole.fromApiData)

    return new Service(
      apiData.id,
      apiData.displayName,
      apiData.createdDateTime,
      apiData.clientIdentifier,
      apiData.description,
      roles,
    )
  }
}
