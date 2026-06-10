import {
  GroupServiceRole,
  type GroupServiceRoleId,
} from '@/models/groupservicerole.model'

/**
 * The shape of the data that comes from the API.
 */
export type GroupServiceRoleApiData = {
  /**
   * The allowed identity providers.
   */
  allowedIdentityProviders: string[]

  /**
   * The description of the group service role.
   */
  description: string

  /**
   * The enabled status of the group service role.
   *
   * Note that this is mapped to the object "isEnabled" field.
   */
  enabled: boolean

  /**
   * The unique identifier for the group service role.
   */
  id: GroupServiceRoleId

  /**
   * The name of the group service role.
   */
  name: string
}

export const groupServiceRoleMapper = {
  /**
   * Creates a GroupServiceRole instance from API response data.
   *
   * @param apiData - The raw group service role data from the API.
   * @returns A new GroupServiceRole instance.
   */
  fromApiData: (apiData: GroupServiceRoleApiData): GroupServiceRole => {
    return new GroupServiceRole(
      apiData.id,
      apiData.name,
      apiData.description,
      apiData.allowedIdentityProviders,
      apiData.enabled,
    )
  },
}
