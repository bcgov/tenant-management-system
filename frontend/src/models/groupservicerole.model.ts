export type GroupServiceRoleId = string & {
  readonly __brand: 'GroupServiceRoleId'
}
export const toGroupServiceRoleId = (id: string): GroupServiceRoleId =>
  id as GroupServiceRoleId

export class GroupServiceRole {
  /**
   * The allowed identity providers.
   */
  allowedIdentityProviders: string[]

  /**
   * The description of the group service role.
   */
  description: string

  /**
   * The unique identifier for the group service role.
   */
  id: GroupServiceRoleId

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
   * @param id - The unique identifier for the group service role.
   * @param name - The name of the group service role.
   * @param description - The description of the group service role.
   * @param allowedIdentityProviders - The allowed identity providers.
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
