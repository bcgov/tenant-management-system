export type ServiceRoleId = string & { readonly __brand: 'ServiceRoleId' }
export const toServiceRoleId = (id: string): ServiceRoleId =>
  id as ServiceRoleId

/**
 * Utility type that represents the subset of Service Role properties used in
 * the form that edits these fields.
 */
export type ServiceRoleDetailFields = Pick<
  ServiceRole,
  'description' | 'identityProviders' | 'name'
>

/**
 * Configuration options required to instantiate a Service.
 */
export type ServiceRoleConfig = {
  createdBy: string
  createdDate: string
  description: string
  id: ServiceRoleId
  identityProviders: string[]
  isDeleted: boolean
  name: string
}

/**
 * Represents a service role within the system.
 */
export class ServiceRole {
  /**
   * The identifier of the user who created this service role.
   */
  createdBy: string

  /**
   * The ISO8601 date string (YYYY-MM-DD) when service role was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

  /**
   * The description of the service role.
   */
  description: string

  /**
   * The unique identifier for the service role.
   */
  id: ServiceRoleId

  /**
   * The identity providers that define which identities can use the role.
   */
  identityProviders: string[]

  /**
   * Whether or not the service role is deleted.
   */
  isDeleted: boolean

  /**
   * The name of the service role.
   */
  name: string

  /**
   * Creates a new ServiceRole instance.
   *
   * @param config - The configuration properties for the service role.
   * @returns A new ServiceRole instance.
   */
  constructor(config: ServiceRoleConfig) {
    this.createdBy = config.createdBy
    this.createdDate = config.createdDate
    this.description = config.description
    this.id = config.id
    this.identityProviders = config.identityProviders
    this.isDeleted = config.isDeleted
    this.name = config.name
  }
}
