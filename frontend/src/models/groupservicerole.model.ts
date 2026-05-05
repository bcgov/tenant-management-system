import { SharedServiceArray } from '@/models/sharedservicerole.model'

export type GroupServiceRoleId = string & {
  readonly __brand: 'GroupServiceRoleId'
}

/**
 * The shape of the data that comes from the API.
 */
export type GroupServiceRoleApiData = {
  /**
   * Created by for this group service role.
   */
  createdBy: string

  /**
   * ISO8601 date string (YYYY-MM-DD) when group service role was created.
   *
   * Note: This is mapped from 'createdDateTime' in the API.
   */
  createdDateTime: string

  /**
   * Description of the group service role.
   */
  description: string

  /**
   * Whether or not the group service role is enabled.
   */
  enabled: boolean

  /**
   * Unique identifier for the group service role.
   */
  id: GroupServiceRoleId

  /**
   * Name of the group service role.
   */
  name: string
}

export class GroupServiceRole {
  sharedServices: SharedServiceArray[]

  constructor(sharedServices: SharedServiceArray[]) {
    this.sharedServices = sharedServices
  }
}
