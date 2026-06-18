export type GroupServiceRoleId = string & {
  readonly __brand: 'GroupServiceRoleId'
}
export const toGroupServiceRoleId = (id: string): GroupServiceRoleId =>
  id as GroupServiceRoleId

/**
 * Configuration options required to instantiate a GroupServiceRole.
 */
export type GroupServiceRoleConfig = {
  description: string
  id: GroupServiceRoleId
  identityProviders: string[]
  isEnabled: boolean
  name: string
}

export class GroupServiceRole {
  /**
   * The description of the group service role.
   */
  description: string

  /**
   * The unique identifier for the group service role.
   */
  id: GroupServiceRoleId

  /**
   * The allowed identity providers.
   *
   * Note that this is mapped from the API data "allowedIdentityProviders"
   * field.
   */
  identityProviders: string[]

  /**
   * Whether or not the group service role is enabled.
   *
   * Note that this is mapped from the API data "enabled" field.
   */
  isEnabled: boolean

  /**
   * The name of the group service role.
   */
  name: string

  /**
   * Creates a new GroupServiceRole instance.
   *
   * @param config - The configuration properties for the group service role.
   * @returns A new GroupServiceRole instance.
   */
  constructor(config: GroupServiceRoleConfig) {
    this.description = config.description
    this.id = config.id
    this.identityProviders = config.identityProviders
    this.isEnabled = config.isEnabled
    this.name = config.name
  }
}
