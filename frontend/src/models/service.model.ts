import { ServiceRole } from './servicerole.model'

enum ServiceIdEnum {
  _ = '',
}
declare type ServiceId = string & ServiceIdEnum

enum RoleIdEnum {
  _ = '',
}
declare type RoleId = string & RoleIdEnum

/**
 * Represents a service in the system.
 */

export type RolesType = {
  description: string
  id: RoleId
  name: string
  allowedIdentityProviders: string[]
  createdBy: string
  updatedBy: string
  isDeleted: boolean
  createdDateTime: string
  updatedDateTime: string
  enabled?: boolean | undefined
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
   * Display name of the service.
   */
  clientIdentifier: string

  /**
   * Created by user identifier.
   */
  createdBy: string

  /**
   * Service Description
   */
  description: string

  /**
   * Whether or not the service is active
   */
  isActive: boolean

  /**
   * ISO8601 date string (YYYY-MM-DD) when service was created.
   *
   * Note: This is mapped from 'updatedDateTime' in the API.
   */
  updatedDate: string

  /**
   * The roles in available in the service
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
    id: string,
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
    this.id = id as ServiceId
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
   * @param apiData.createdDateTime - ISO8601 date string (YYYY-MM-DD) when
   *     service was created
   * @param apiData.id - Unique identifier for the service
   * @param apiData.name - Display name of the service
   * @param apiData.clientIdentifier - Client identifier of the service
   * @param apiData.createdBy - Created by user identifier
   * @param apiData.description - Service Description
   * @param apiData.isActive - Whether or not the service is active
   * @param apiData.updatedDateTime - ISO8601 date string (YYYY-MM-DD) when
   *     service was created
   * @param apiData.serviceRoles - The roles in available in the service
   * @returns A new Service instance
   */
  static fromApiData(apiData: {
    createdDateTime: string
    id: string
    name: string
    clientIdentifier: string
    createdBy: string
    description: string
    isActive: boolean
    updatedDateTime: string
    roles: RolesType[]
  }): Service {
    const serviceRoles = apiData.roles.map((roleData) =>
      ServiceRole.fromApiData(roleData),
    )
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
