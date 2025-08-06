import { GroupUser } from '@/models'

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
   * The username of who created the group.
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
  id: string

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
   * @param createdBy - The username of who created the group
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
    id: string,
    name: string,
    groupUsers: GroupUser[],
  ) {
    this.createdBy = createdBy
    this.createdDate = createdDate
    this.description = description
    this.id = id
    this.name = name
    this.groupUsers = Array.isArray(groupUsers) ? groupUsers : []
  }

  /**
   * Creates a Group instance from API response data.
   *
   * Note: The API returns 'createdDateTime' which is mapped to the
   * 'createdDate' property.
   *
   * @param apiData - The raw group data from the API
   * @param apiData.createdBy - The username of who created the group
   * @param apiData.createdDateTime - ISO8601 date string (YYYY-MM-DD) when
   *     group was created
   * @param apiData.description - Description of the group
   * @param apiData.id - Unique identifier for the group
   * @param apiData.name - Display name of the group
   * @param apiData.groupUsers - Array of raw group user objects to be converted
   * @returns A new Group instance
   */
  static fromApiData(apiData: {
    createdBy: string
    createdDateTime: string
    description: string
    id: string
    name: string
    users: GroupUser[]
  }): Group {
    const groupUsers = Array.isArray(apiData.users)
      ? apiData.users.map(GroupUser.fromApiData)
      : []

    return new Group(
      apiData.createdBy,
      apiData.createdDateTime,
      apiData.description,
      apiData.id,
      apiData.name,
      groupUsers,
    )
  }
}
