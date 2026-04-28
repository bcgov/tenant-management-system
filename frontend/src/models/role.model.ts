export type RoleId = string & { readonly __brand: 'RoleId' }
export const toRoleId = (id: string): RoleId => id as RoleId

/**
 * The shape of the data that comes from the API.
 */
export type RoleApiData = {
  /**
   * Description of the role.
   */
  description: string

  /**
   * Unique identifier for the role.
   */
  id: RoleId

  /**
   *  Name of the role.
   */
  name: string
}

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
   * @param id - Unique identifier for the role
   * @param name - Name of the role
   * @param description - Description of the role
   */
  constructor(id: RoleId, name: string, description: string) {
    this.description = description
    this.id = id
    this.name = name
  }

  /**
   * Creates a Role instance from API response data.
   *
   * @param apiData - The raw role data from the API
   * @returns A new Role instance
   */
  static fromApiData(apiData: RoleApiData): Role {
    return new Role(apiData.id, apiData.name, apiData.description)
  }
}
