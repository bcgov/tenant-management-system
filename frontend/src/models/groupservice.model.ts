import {
  GroupServiceRole,
  type GroupServiceRoleApiData,
} from '@/models/groupservicerole.model'

export type GroupServiceId = string & { readonly __brand: 'GroupServiceId' }
export const toGroupServiceId = (id: string): GroupServiceId =>
  id as GroupServiceId

/**
 * The shape of the data that comes from the API.
 */
export type GroupServiceApiData = {
  /**
   * The client identifier for the group service.
   */
  clientIdentifier: string

  /**
   * The description of the group service.
   */
  description: string

  /**
   * The display name of the group service.
   */
  displayName: string

  /**
   * The unique identifier for the group service.
   */
  id: string

  /**
   * The roles available in the group service.
   */
  sharedServiceRoles: GroupServiceRoleApiData[]
}

export class GroupService {
  /**
   * The client identifier for the group service.
   */
  clientIdentifier: string

  /**
   * The description of the group service.
   */
  description: string

  /**
   * The display name of the group service.
   */
  displayName: string

  /**
   * The unique identifier for the group service.
   */
  id: GroupServiceId

  /**
   * The roles in available in the group service.
   */
  roles: GroupServiceRole[]

  /**
   * Creates a new GroupService instance.
   *
   * @param id - The unique identifier for the group service
   * @param displayName - The display name of the group service
   * @param clientIdentifier - The client identifier for the group service
   * @param description - The description of the group service
   * @param roles - The roles available in the group service
   * @returns A new GroupService instance
   */
  constructor(
    id: GroupServiceId,
    displayName: string,
    clientIdentifier: string,
    description: string,
    roles: GroupServiceRole[],
  ) {
    this.clientIdentifier = clientIdentifier
    this.description = description
    this.displayName = displayName
    this.id = id
    this.roles = roles
  }

  /**
   * Creates a GroupService instance from API response data.
   *
   * Note: The API returns 'createdDateTime' which is mapped to the
   * 'createdDate' property.
   *
   * @param apiData - The raw group service data from the API
   * @returns A new GroupService instance
   */
  static fromApiData(apiData: GroupServiceApiData): GroupService {
    const roles = apiData.sharedServiceRoles.map(GroupServiceRole.fromApiData)

    return new GroupService(
      toGroupServiceId(apiData.id),
      apiData.displayName,
      apiData.clientIdentifier,
      apiData.description,
      roles,
    )
  }

  /**
   * Gets the number of roles in the service that are enabled.
   *
   * @return the number of enabled roles.
   */
  get enabledRolesCount(): number {
    return this.roles.filter((role) => role.isEnabled).length
  }

  /**
   * Gets whether or not the service has any enabled roles.
   *
   * @return true if one or more roles are enabled.
   */
  get hasEnabledRoles(): boolean {
    return this.enabledRolesCount > 0
  }
}
