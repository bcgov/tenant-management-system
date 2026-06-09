import { User } from '@/models/user.model'

export type GroupUserId = string & { readonly __brand: 'GroupUserId' }
export const toGroupUserId = (id: string): GroupUserId => id as GroupUserId

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
   * @param id - Unique identifier for the group user.
   * @param user - The user associated with the group user.
   */
  constructor(id: GroupUserId, user: User) {
    this.id = id
    this.user = user
  }
}
