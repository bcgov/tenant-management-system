export type GroupServiceRoleId = string & {
  readonly __brand: 'GroupServiceRoleId'
}
export const toGroupServiceRoleId = (id: string): GroupServiceRoleId =>
  id as GroupServiceRoleId

/**
 * The shape of the data that comes from the API.
 */
export type GroupServiceRoleApiData = {
  /**
   * Allowed identity providers.
   */
  allowedIdentityProviders: string[]

  /**
   * Description of the group service role.
   */
  description: string

  /**
   * Whether or not the group service role is enabled.
   *
   * Note that this is mapped to the object "enabled" field.
   */
  enabled: boolean

  /**
   * Unique identifier for the group service role.
   */
  id: GroupServiceRoleId

  /**
   * Name of the group service role.
   */
  name: string
}

export class GroupServiceRole {
  /**
   * Allowed identity providers.
   */
  allowedIdentityProviders: string[]

  /**
   * Description of the service role.
   */
  description: string

  /**
   * Unique identifier for the service role.
   */
  id: GroupServiceRoleId

  /**
   * Whether or not the service role is enabled.
   *
   * Note that this is mapped from the API data "enabled" field.
   */
  isEnabled: boolean

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
    id: GroupServiceRoleId,
    name: string,
    description: string,
    allowedIdentityProviders: string[],
    isEnabled: boolean,
  ) {
    this.description = description
    this.id = id
    this.name = name
    this.allowedIdentityProviders = allowedIdentityProviders
    this.isEnabled = isEnabled
  }

  /**
   * Creates a ServiceRole instance from API response data.
   *
   * @param apiData - The raw service role data from the API
   * @returns A new ServiceRole instance
   */
  static fromApiData(apiData: GroupServiceRoleApiData): GroupServiceRole {
    return new GroupServiceRole(
      apiData.id,
      apiData.name,
      apiData.description,
      apiData.allowedIdentityProviders,
      apiData.enabled,
    )
  }
}
