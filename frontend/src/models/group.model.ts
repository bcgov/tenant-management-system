import { GroupUser } from '@/models/groupuser.model'

export type GroupId = string & { readonly __brand: 'GroupId' }
export const toGroupId = (id: string): GroupId => id as GroupId

/**
 * Utility type that represents the subset of Group properties used in the form
 * that edits these fields.
 */
export type GroupDetailFields = Pick<Group, 'description' | 'name'>

/**
 * Configuration options required to instantiate a Service.
 */
export type GroupConfig = {
  createdBy: string
  createdDate: string
  description: string
  id: GroupId
  name: string
  groupUsers: GroupUser[]
}

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
   * @param config - The configuration properties for the group.
   * @returns A new Group instance.
   */
  constructor(config: GroupConfig) {
    this.createdBy = config.createdBy
    this.createdDate = config.createdDate
    this.description = config.description
    this.id = config.id
    this.groupUsers = config.groupUsers
    this.name = config.name
  }
}
