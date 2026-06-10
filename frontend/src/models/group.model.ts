import { GroupUser } from '@/models/groupuser.model'

export type GroupId = string & { readonly __brand: 'GroupId' }
export const toGroupId = (id: string): GroupId => id as GroupId

/**
 * Utility type that represents the subset of Group properties used in the form
 * that edits these fields.
 */
export type GroupDetailFields = Pick<Group, 'description' | 'name'>

/**
 * Represents a group in the system.
 */
export class Group {
  /**
   * The identity of who created the group.
   */
  createdBy: string

  /**
   * The ISO8601 date string (YYYY-MM-DD) for when the group was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

  /**
   * The description of the group.
   */
  description: string

  /**
   * The unique identifier for the group.
   */
  id: GroupId

  /**
   * The name of the group.
   */
  name: string

  /**
   * The array of group users associated with this group.
   */
  groupUsers: GroupUser[]

  /**
   * Creates a new Group instance.
   *
   * @param createdBy - The identity of who created the group.
   * @param createdDate - The ISO8601 date string (YYYY-MM-DD) for when the
   *   group was created.
   * @param description - The description of the group.
   * @param id - The unique identifier for the group.
   * @param name - The name of the group.
   * @param groupUsers - The array of group users associated with this group.
   */
  constructor(
    createdBy: string,
    createdDate: string,
    description: string,
    id: GroupId,
    name: string,
    groupUsers: GroupUser[],
  ) {
    this.createdBy = createdBy
    this.createdDate = createdDate
    this.description = description
    this.id = id
    this.name = name
    this.groupUsers = groupUsers
  }
}
