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
   * Whether or not the service role is enabled.
   */
  enabled?: boolean

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

  /**
   * Updated by for this service role.
   */
  updatedBy: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when service role was updated.
   *
   * Note: This is mapped from 'updateddateTime' in the API.
   */
  updatedDateTime: string
}

/**
 * Represents a service role within the system.
 */
export class ServiceRole {
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
  createdDate: string

  /**
   * Description of the service role.
   */
  description: string

  /**
   * Whether or not the service role is enabled.
   */
  enabled: boolean

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

  /**
   * Updated by for this service role.
   */
  updatedBy: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when service role was updated.
   *
   * Note: This is mapped from 'updateddateTime' in the API.
   */
  updatedDate: string

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
    allowedIdentityProviders: string[],
    createdBy: string,
    updatedBy: string,
    isDeleted: boolean,
    createdDate: string,
    updatedDate: string,
    enabled: boolean = false,
  ) {
    this.description = description
    this.id = id
    this.name = name
    this.allowedIdentityProviders = allowedIdentityProviders
    this.createdBy = createdBy
    this.updatedBy = updatedBy
    this.isDeleted = isDeleted
    this.createdDate = createdDate
    this.updatedDate = updatedDate
    this.enabled = enabled
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
      apiData.updatedBy,
      apiData.isDeleted,
      apiData.createdDateTime,
      apiData.updatedDateTime,
      apiData.enabled,
    )
  }
}
