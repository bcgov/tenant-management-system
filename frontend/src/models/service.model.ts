import {
  ServiceRole,
  type ServiceRoleDetailFields,
} from '@/models/servicerole.model'

export type ServiceId = string & { readonly __brand: 'ServiceId' }
export const toServiceId = (id: string): ServiceId => id as ServiceId

/**
 * Utility type that represents the subset of Service properties used in the
 * form that edits these fields. Note that the roles are also using the subset
 * type for the ServiceRole fields.
 */
export type ServiceDetailFields = Pick<
  Service,
  'clientIdentifier' | 'description' | 'displayName' | 'landingPageUrl' | 'name'
> & { roles: ServiceRoleDetailFields[] }

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
   * The URL for the landing page of the service.
   */
  landingPageUrl: string

  /**
   * The name of the service.
   */
  name: string

  /**
   * The roles in available in the service.
   */
  roles: ServiceRole[]

  /**
   * The ISO8601 date string (YYYY-MM-DD) when service was last updated.
   *
   * Note: This is mapped from 'updatedDateTime' in the API.
   */
  updatedDate: string

  /**
   * Creates a new Service instance.
   *
   * @param id - The unique identifier for the service.
   * @param name - The name of the service.
   * @param displayName - The display name of the service.
   * @param createdDate - The ISO8601 date string (YYYY-MM-DD) when service was
   *   created.
   * @param clientIdentifier - The client identifier for the service.
   * @param landingPageUrl - The URL for the landing page of the service.
   * @param description - The description of the service.
   * @param roles - The roles in available in the service.
   * @param updatedDate - When the service was last updated.
   * @returns A new Service instance.
   */
  constructor(
    id: ServiceId,
    name: string,
    displayName: string,
    createdDate: string,
    clientIdentifier: string,
    landingPageUrl: string,
    description: string,
    updatedDate: string,
    roles: ServiceRole[],
  ) {
    this.clientIdentifier = clientIdentifier
    this.createdDate = createdDate
    this.description = description
    this.displayName = displayName
    this.id = id
    this.name = name
    this.landingPageUrl = landingPageUrl
    this.roles = roles
    this.updatedDate = updatedDate
  }
}
