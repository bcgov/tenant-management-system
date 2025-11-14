import { User } from '@/models'

enum GroupUserIdEnum {
  _ = '',
}
declare type GroupUserId = string & GroupUserIdEnum

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
  constructor(id: string, user: User) {
    this.id = id as GroupUserId
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
  static fromApiData(apiData: { id: string; user: User }): GroupUser {
    const user = User.fromApiData(apiData.user)

    return new GroupUser(apiData.id, user)
  }
}
