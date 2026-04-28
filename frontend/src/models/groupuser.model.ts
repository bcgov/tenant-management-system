import { User, type UserApiData } from '@/models/user.model'

export type GroupUserId = string & { readonly __brand: 'GroupUserId' }

/**
 * The shape of the data that comes from the API.
 */
export type GroupUserApiData = {
  /**
   * Unique identifier for the group user.
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
export class GroupUser {
  /**
   * Unique identifier for the group user.
   */
  id: GroupUserId

  /**
   * The user associated with the group user.
   */
  user: User

  /**
   * Creates a new GroupUser instance.
   *
   * @param id - Unique identifier for the group user
   * @param user - The user associated with the group user
   */
  constructor(id: GroupUserId, user: User) {
    this.id = id
    this.user = user
  }

  /**
   * Creates a GroupUser instance from API response data.
   *
   * @param apiData - The raw group user data from the API
   * @param apiData.id - Unique identifier for the group user
   * @param apiData.user - Raw user data to be converted to a User instance
   * @returns A new GroupUser instance
   */
  static fromApiData(apiData: GroupUserApiData): GroupUser {
    const user = User.fromApiData(apiData.user)

    return new GroupUser(apiData.id, user)
  }
}
