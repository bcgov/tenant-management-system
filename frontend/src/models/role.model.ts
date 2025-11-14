enum RoleIdEnum {
  _ = '',
}
export declare type RoleId = string & RoleIdEnum

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
  constructor(id: string, name: string, description: string) {
    this.description = description
    this.id = id as RoleId
    this.name = name
  }

  /**
   * Creates a Role instance from API response data.
   *
   * @param apiData - The raw role data from the API
   * @param apiData.description - Description of the role
   * @param apiData.id - Unique identifier for the role
   * @param apiData.name - Name of the role
   * @returns A new Role instance
   */
  static fromApiData(apiData: {
    description: string
    id: string
    name: string
  }): Role {
    return new Role(apiData.id, apiData.name, apiData.description)
  }
}
