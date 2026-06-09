import {
  type GroupUserApiData,
  groupUserMapper,
} from '@/mappers/groupuser.mapper'
import { Group, type GroupId } from '@/models/group.model'

/**
 * The shape of the data that comes from the API.
 */
export type GroupApiData = {
  /**
   * The identity of who created the group.
   */
  createdBy: string

  /**
   * The display name of who created the group, may be undefined.
   */
  createdByDisplayName?: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when the group was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDateTime: string

  /**
   * Description of the group.
   */
  description: string

  /**
   * Unique identifier for the group.
   */
  id: GroupId

  /**
   * Display name of the group.
   */
  name: string

  /**
   * Array of group users associated with this group, may be undefined.
   */
  users?: GroupUserApiData[]
}

export const groupMapper = {
  /**
   * Creates a Group instance from API response data.
   *
   * Note: The API returns 'createdDateTime' which is mapped to the
   * 'createdDate' property.
   *
   * Note: The API may return 'createdByDisplayName', in which case it is used
   * in preference to the createBy UUID.
   *
   * @param apiData - The raw group data from the API
   * @returns A new Group instance
   */
  fromApiData: (apiData: GroupApiData): Group => {
    const groupUsers = Array.isArray(apiData.users)
      ? apiData.users.map(groupUserMapper.fromApiData)
      : []

    return new Group(
      apiData.createdByDisplayName || apiData.createdBy,
      apiData.createdDateTime,
      apiData.description,
      apiData.id,
      apiData.name,
      groupUsers,
    )
  },
}
