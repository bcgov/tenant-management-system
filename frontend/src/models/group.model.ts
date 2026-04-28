import { GroupUser, type GroupUserApiData } from '@/models/groupuser.model'

export type GroupId = string & { readonly __brand: 'GroupId' }
export const toGroupId = (id: string): GroupId => id as GroupId

/**
 * The shape of the data that comes from the API.
 */
type GroupApiData = {
  /**
   * The identity of who created the group.
   */
  createdBy: string

  /**
   * The username of who created the group, may be undefined.
   */
  createdByUserName?: string

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
   * ISO8601 date string (YYYY-MM-DD) when the group was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDate: string

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
   * Array of group users associated with this group.
   */
  groupUsers: GroupUser[]

  /**
   * Creates a new Group instance.
   *
   * @param createdBy - The identity of who created the group
   * @param createdDate - ISO8601 date string (YYYY-MM-DD) when group was
   *   created
   * @param description - Description of the group
   * @param id - Unique identifier for the group
   * @param name - Display name of the group
   * @param groupUsers - Array of group users associated with this group
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

  /**
   * Creates a Group instance from API response data.
   *
   * Note: The API returns 'createdDateTime' which is mapped to the
   * 'createdDate' property.
   *
   * Note: The API may return 'createdByUserName', in which case it is used in
   * preference to the createBy UUID.
   *
   * @param apiData - The raw group data from the API
   * @returns A new Group instance
   */
  static fromApiData(apiData: GroupApiData): Group {
    const groupUsers = Array.isArray(apiData.users)
      ? apiData.users.map(GroupUser.fromApiData)
      : []

    return new Group(
      apiData.createdByUserName || apiData.createdBy,
      apiData.createdDateTime,
      apiData.description,
      apiData.id,
      apiData.name,
      groupUsers,
    )
  }
}
