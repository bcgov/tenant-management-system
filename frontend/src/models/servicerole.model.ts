export type ServiceRoleId = string & { readonly __brand: 'ServiceRoleId' }
export const toServiceRoleId = (id: string): ServiceRoleId =>
  id as ServiceRoleId

/**
 * The shape of the data that comes from the API.
 */
export type ServiceRoleApiData = {
  /**
   * Allowed identity providers.
   */
  allowedIdentityProviders: string[]

  /**
   * Created by for this service role.
   */
  createdBy: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when service role was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDateTime: string

  /**
   * Description of the service role.
   */
  description: string

  /**
   * Unique identifier for the service role.
   */
  id: ServiceRoleId

  /**
   * Whether or not the service role is deleted.
   */
  isDeleted: boolean

  /**
   * Name of the service role.
   */
  name: string
}

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
   * Created by for this service role.
   */
  createdBy: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when service role was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

  /**
   * Description of the service role.
   */
  description: string

  /**
   * Unique identifier for the service role.
   */
  id: ServiceRoleId

  /**
   * Identity providers that define which identities can use the role.
   */
  identityProviders: string[]

  /**
   * Whether or not the service role is deleted.
   */
  isDeleted: boolean

  /**
   * Name of the service role.
   */
  name: string

  /**
   * Creates a new Role instance.
   *
   * @param id - Unique identifier for the role
   * @param name - Name of the role
   * @param description - Description of the role
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

  /**
   * Creates a ServiceRole instance from API response data.
   *
   * @param apiData - The raw service role data from the API
   * @returns A new ServiceRole instance
   */
  static fromApiData(apiData: ServiceRoleApiData): ServiceRole {
    return new ServiceRole(
      apiData.id,
      apiData.name,
      apiData.description,
      apiData.allowedIdentityProviders,
      apiData.createdBy,
      apiData.createdDateTime,
      apiData.isDeleted,
    )
  }
}
