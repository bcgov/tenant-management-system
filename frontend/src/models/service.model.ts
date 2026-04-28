import { type ServiceRoleApiData } from './servicerole.model'
import { ServiceRole } from './servicerole.model'

export type ServiceId = string & { readonly __brand: 'ServiceId' }

/**
 * The shape of the data that comes from the API.
 */
type ServiceApiData = {
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
   * Unique identifier for the service.
   */
  id: ServiceId

  /**
   * Whether or not the service is active.
   */
  isActive: boolean

  /**
   * Display name of the service.
   */
  name: string

  /**
   * The roles in available in the service.
   */
  serviceRoles: ServiceRoleApiData[]

  /**
   * ISO8601 date string (YYYY-MM-DD) when service was created.
   *
   * Note: This is mapped from 'updatedDateTime' in the API.
   */
  updatedDateTime: string
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
   * Display name of the service.
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
   * Whether or not the service is active.
   */
  isActive: boolean

  /**
   * ISO8601 date string (YYYY-MM-DD) when service was created.
   *
   * Note: This is mapped from 'updatedDateTime' in the API.
   */
  updatedDate: string

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
    isActive: boolean,
    updatedDate: string,
    serviceRoles: ServiceRole[],
  ) {
    this.createdDate = createdDate
    this.id = id
    this.name = name
    this.clientIdentifier = clientIdentifier
    this.createdBy = createdBy
    this.description = description
    this.isActive = isActive
    this.updatedDate = updatedDate
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
    const serviceRoles = apiData.serviceRoles.map(ServiceRole.fromApiData)

    return new Service(
      apiData.id,
      apiData.name,
      apiData.createdDateTime,
      apiData.clientIdentifier,
      apiData.createdBy,
      apiData.description,
      apiData.isActive,
      apiData.updatedDateTime,
      serviceRoles,
    )
  }
}
