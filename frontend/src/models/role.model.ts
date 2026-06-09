export type RoleId = string & { readonly __brand: 'RoleId' }
export const toRoleId = (id: string): RoleId => id as RoleId

/**
 * Represents a role within the system.
 */
export class Role {
  /**
   * Description of the role.
   */
  description: string

  /**
   * Unique identifier for the role.
   */
  id: RoleId

  /**
   * Name of the role.
   */
  name: string

  /**
   * Creates a new Role instance.
   *
   * @param id - Unique identifier for the role.
   * @param name - Name of the role.
   * @param description - Description of the role.
   */
  constructor(id: RoleId, name: string, description: string) {
    this.description = description
    this.id = id
    this.name = name
  }
}
