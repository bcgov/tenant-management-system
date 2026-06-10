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
   * @param id - The unique identifier for the service role.
   * @param name - The name of the service role.
   * @param description - The description of the service role.
   * @param identityProviders - The identity providers that define which
   *   identities can use the role.
   * @param createdBy - The identifier of the user who created this service
   *   role.
   * @param createdDate - The ISO8601 date string (YYYY-MM-DD) when service role
   *   was created.
   * @param isDeleted - Whether or not the service role is deleted.
   * @returns A new ServiceRole instance.
   */
  constructor(
    id: ServiceRoleId,
    name: string,
    description: string,
    identityProviders: string[],
    createdBy: string,
    createdDate: string,
    isDeleted: boolean,
  ) {
    this.description = description
    this.id = id
    this.name = name
    this.identityProviders = identityProviders
    this.createdBy = createdBy
    this.createdDate = createdDate
    this.isDeleted = isDeleted
  }
}
