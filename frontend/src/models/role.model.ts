export type RoleId = string & { readonly __brand: 'RoleId' }
export const toRoleId = (id: string): RoleId => id as RoleId

/**
 * Configuration options required to instantiate a Role.
 */
export type RoleConfig = {
  description: string
  id: RoleId
  name: string
}

/**
 * Represents a role within the system.
 */
export class Role {
  /**
   * The description of the role.
   */
  description: string

  /**
   * The unique identifier for the role.
   */
  id: RoleId

  /**
   * The name of the role.
   */
  name: string

  /**
   * Creates a new Role instance.
   *
   * @param config - The configuration properties for the role.
   * @returns A new Role instance.
   */
  constructor(config: RoleConfig) {
    this.description = config.description
    this.id = config.id
    this.name = config.name
  }
}
