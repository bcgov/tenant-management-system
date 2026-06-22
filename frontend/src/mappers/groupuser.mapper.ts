import { type UserApiData, userMapper } from '@/mappers/user.mapper'
import { GroupUser } from '@/models/groupuser.model'

import { type GroupUserId } from '@/models/groupuser.model'

/**
 * The shape of the data that comes from the API.
 */
export type GroupUserApiData = {
  /**
   * The unique identifier for the group user.
   */
  id: GroupUserId

  /**
   * The user associated with the group user.
   */
  user: UserApiData
}

/**
 * Represents a user within a group.
 */
export const groupUserMapper = {
  /**
   * Creates a GroupUser instance from API response data.
   *
   * @param apiData - The raw group user data from the API.
   * @returns A new GroupUser instance.
   */
  fromApiData: (apiData: GroupUserApiData): GroupUser => {
    const user = userMapper.fromApiData(apiData.user)

    return new GroupUser({ id: apiData.id, user })
  },
}
