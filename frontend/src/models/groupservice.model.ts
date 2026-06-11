import { GroupServiceRole } from '@/models/groupservicerole.model'

export type GroupServiceId = string & { readonly __brand: 'GroupServiceId' }
export const toGroupServiceId = (id: string): GroupServiceId =>
  id as GroupServiceId

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
   * @param id - The unique identifier for the group service.
   * @param displayName - The display name of the group service.
   * @param clientIdentifier - The client identifier for the group service.
   * @param description - The description of the group service.
   * @param roles - The roles available in the group service.
   * @returns A new GroupService instance.
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
