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
   * Client identifier for the service.
   */
  clientIdentifier: string

  /**
   * Created by user identifier.
   */
  createdBy: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when service was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDateTime: string

  /**
   * Description of the service.
   */
  description: string

  /**
   * Display name of the service.
   */
  displayName: string

  /**
   * Unique identifier for the service.
   */
  id: ServiceId

  /**
   * The roles in available in the service.
   */
  roles: ServiceRoleApiData[]
}

export class Service {
  /**
   * ISO8601 date string (YYYY-MM-DD) when service was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

  /**
   * Unique identifier for the service.
   */
  id: ServiceId

  /**
   * The name of the service.
   *
   * Note: This is mapped from 'displayName' in the API.
   */
  name: string

  /**
   * Client identifier for the service.
   */
  clientIdentifier: string

  /**
   * Created by user identifier.
   */
  createdBy: string

  /**
   * Description of the service.
   */
  description: string

  /**
   * The roles in available in the service.
   */
  serviceRoles: ServiceRole[]

  /**
   * Creates a new Service instance.
   *
   * @param id - Unique identifier for the service
   * @param name - Display name of the service
   * @param createdDate - ISO8601 date string (YYYY-MM-DD) when service was
   *   created
   */
  constructor(
    id: ServiceId,
    name: string,
    createdDate: string,
    clientIdentifier: string,
    createdBy: string,
    description: string,
    serviceRoles: ServiceRole[],
  ) {
    this.createdDate = createdDate
    this.id = id
    this.name = name
    this.clientIdentifier = clientIdentifier
    this.createdBy = createdBy
    this.description = description
    this.serviceRoles = serviceRoles
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
    const serviceRoles = apiData.roles.map(ServiceRole.fromApiData)

    return new Service(
      apiData.id,
      apiData.displayName,
      apiData.createdDateTime,
      apiData.clientIdentifier,
      apiData.createdBy,
      apiData.description,
      serviceRoles,
    )
  }
}
