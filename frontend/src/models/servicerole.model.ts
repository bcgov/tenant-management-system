/**
 * Represents a service role within the system.
 */
export class ServiceRole {
  /**
   * Description of the role.
   */
  description: string

  /**
   * Unique identifier for the role.
   */
  id: string

  /**
   * Name of the role.
   */
  name: string

  /**
   * Allowed identity providers
   */
  allowedIdentityProviders: string[]

  /**
   * Created by for this role
   */
  createdBy: string

  /**
   * Updated by for this role
   */
  updatedBy: string

  /**
   * Whether or not the role is deleted
   */
  isDeleted: boolean

  /**
   * ISO8601 date string (YYYY-MM-DD) when service was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when service was created.
   *
   * Note: This is mapped from 'updateddateTime' in the API.
   */
  updatedDate: string

  /**
   * Whether or not the role is enabled
   */
  enabled: boolean

  /**
   * Creates a new Role instance.
   *
   * @param id - Unique identifier for the role
   * @param name - Name of the role
   * @param description - Description of the role
   */
  constructor(
    id: string,
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
   * Creates a Role instance from API response data.
   *
   * @param apiData - The raw role data from the API
   * @param apiData.description - Description of the role
   * @param apiData.id - Unique identifier for the role
   * @param apiData.name - Name of the role
   * @param apiData.allowedIdentityProviders - Allowed identity providers
   * @param apiData.createdBy - Created by for this role
   * @param apiData.updatedBy - Updated by for this role
   * @param apiData.isDeleted - Whether or not the role is deleted
   * @param apiData.createdDateTime - ISO8601 date string (YYYY-MM-DD) when service was created
   * @param apiData.updatedDateTime - ISO8601 date string (YYYY-MM-DD) when service was created
   * @param apiData.enabled - Whether or not the role is enabled
   * @returns A new Role instance
   */
  static fromApiData(apiData: {
    description: string
    id: string
    name: string
    allowedIdentityProviders: string[]
    createdBy: string
    updatedBy: string
    isDeleted: boolean
    createdDateTime: string
    updatedDateTime: string
    enabled?: boolean
  }): ServiceRole {
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
