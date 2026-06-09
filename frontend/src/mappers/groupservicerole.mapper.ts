import {
  GroupServiceRole,
  type GroupServiceRoleId,
} from '@/models/groupservicerole.model'

/**
 * The shape of the data that comes from the API.
 */
export type GroupServiceRoleApiData = {
  /**
   * Allowed identity providers.
   */
  allowedIdentityProviders: string[]

  /**
   * Description of the group service role.
   */
  description: string

  /**
   * Whether or not the group service role is enabled.
   *
   * Note that this is mapped to the object "isEnabled" field.
   */
  enabled: boolean

  /**
   * Unique identifier for the group service role.
   */
  id: GroupServiceRoleId

  /**
   * Name of the group service role.
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
