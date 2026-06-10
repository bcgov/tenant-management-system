export type RoleId = string & { readonly __brand: 'RoleId' }
export const toRoleId = (id: string): RoleId => id as RoleId

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
   * @param id - The unique identifier for the role.
   * @param name - The name of the role.
   * @param description - The description of the role.
   */
  constructor(id: RoleId, name: string, description: string) {
    this.description = description
    this.id = id
    this.name = name
  }
}
