import { Role, type RoleId } from '@/models/role.model'

/**
 * The shape of the data that comes from the API.
 */
export type RoleApiData = {
  /**
   * Description of the role.
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
}

export const roleMapper = {
  /**
   * Creates a Role instance from API response data.
   *
   * @param apiData - The raw role data from the API.
   * @returns A new Role instance.
   */
  fromApiData: (apiData: RoleApiData): Role => {
    return new Role(apiData.id, apiData.name, apiData.description)
  },
}
