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

/**
 * Configuration options required to instantiate a Service.
 */
export type ServiceConfig = {
  clientIdentifier: string
  createdDate: string
  description: string
  displayName: string
  id: ServiceId
  landingPageUrl: string
  name: string
  roles: ServiceRole[]
  updatedDate: string
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
   * @param config - The configuration properties for the service.
   * @returns A new Service instance.
   */
  constructor(config: ServiceConfig) {
    this.clientIdentifier = config.clientIdentifier
    this.createdDate = config.createdDate
    this.description = config.description
    this.displayName = config.displayName
    this.id = config.id
    this.landingPageUrl = config.landingPageUrl
    this.name = config.name
    this.roles = config.roles
    this.updatedDate = config.updatedDate
  }
}
