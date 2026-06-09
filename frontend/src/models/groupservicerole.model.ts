export type GroupServiceRoleId = string & {
  readonly __brand: 'GroupServiceRoleId'
}
export const toGroupServiceRoleId = (id: string): GroupServiceRoleId =>
  id as GroupServiceRoleId

export class GroupServiceRole {
  /**
   * Allowed identity providers.
   */
  allowedIdentityProviders: string[]

  /**
   * Description of the group service role.
   */
  description: string

  /**
   * Unique identifier for the group service role.
   */
  id: GroupServiceRoleId

  /**
   * Whether or not the group service role is enabled.
   *
   * Note that this is mapped from the API data "enabled" field.
   */
  isEnabled: boolean

  /**
   * Name of the group service role.
   */
  name: string

  /**
   * Creates a new GroupServiceRole instance.
   *
   * @param id - Unique identifier for the group service role.
   * @param name - Name of the group service role.
   * @param description - Description of the group service role.
   * @param allowedIdentityProviders - Allowed identity providers.
   * @param isEnabled - Whether or not the group service role is enabled.
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
}
