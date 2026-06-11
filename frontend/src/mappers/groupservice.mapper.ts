import {
  type GroupServiceRoleApiData,
  groupServiceRoleMapper,
} from '@/mappers/groupservicerole.mapper'
import { GroupService, type GroupServiceId } from '@/models/groupservice.model'

/**
 * The shape of the data that comes from the API.
 */
export type GroupServiceApiData = {
  /**
   * The client identifier for the group service.
   */
  clientIdentifier: string

  /**
   * The description of the group service.
   */
  description: string

  /**
   * The display name of the group service.
   */
  displayName: string

  /**
   * The unique identifier for the group service.
   */
  id: GroupServiceId

  /**
   * The roles available in the group service.
   */
  sharedServiceRoles: GroupServiceRoleApiData[]
}

export const groupServiceMapper = {
  /**
   * Creates a GroupService instance from API response data.
   *
   * Note: The API returns 'createdDateTime' which is mapped to the
   * 'createdDate' property.
   *
   * @param apiData - The raw group service data from the API.
   * @returns A new GroupService instance.
   */
  fromApiData: (apiData: GroupServiceApiData): GroupService => {
    const roles = apiData.sharedServiceRoles.map(
      groupServiceRoleMapper.fromApiData,
    )

    return new GroupService(
      apiData.id,
      apiData.displayName,
      apiData.clientIdentifier,
      apiData.description,
      roles,
    )
  },
}
