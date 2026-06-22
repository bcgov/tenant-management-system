import { User } from '@/models/user.model'

export type GroupUserId = string & { readonly __brand: 'GroupUserId' }
export const toGroupUserId = (id: string): GroupUserId => id as GroupUserId

/**
 * Configuration options required to instantiate a GroupUser.
 */
export type GroupUserConfig = {
  id: GroupUserId
  user: User
}

/**
 * Represents a user within a group.
 */
export class GroupUser {
  /**
   * The unique identifier for the group user.
   */
  id: GroupUserId

  /**
   * The user associated with the group user.
   */
  user: User

  /**
   * Creates a new GroupUser instance.
   *
   * @param config - The configuration properties for the group user.
   * @returns A new GroupUser instance.
   */
  constructor(config: GroupUserConfig) {
    this.id = config.id
    this.user = config.user
  }
}
