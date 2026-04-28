import { defineStore } from 'pinia'
import { ref } from 'vue'

import { ServerError } from '@/errors/domain/ServerError'
import {
  Group,
  type GroupDetailFields,
  type GroupId,
} from '@/models/group.model'
import { type GroupServiceRole } from '@/models/groupservicerole.model'
import { GroupUser, type GroupUserId } from '@/models/groupuser.model'
import { ServiceRole } from '@/models/servicerole.model'
import { type TenantId } from '@/models/tenant.model'
import { User } from '@/models/user.model'
import { groupService } from '@/services/group.service'
import { serviceService } from '@/services/service.service'

type GroupRoleType = {
  [key: string]: ServiceRole[]
}

/**
 * Pinia store for managing groups and group users.
 */
export const useGroupStore = defineStore('group', () => {
  const loading = ref(false)
  const groups = ref<Group[]>([])
  const groupRoles = ref<GroupRoleType>({})

  // Private methods

  /**
   * Inserts or updates a group in the store.
   *
   * @param {Group} group - The group to insert or update.
   * @returns {Group} The inserted or updated group.
   */
  function upsertGroup(group: Group) {
    const index = groups.value.findIndex((g) => g.id === group.id)
    if (index === -1) {
      groups.value.push(group)
    } else {
      groups.value[index] = group
    }

    return group
  }

  // Exported Methods

  /**
   * Creates a new group and adds it to the store.
   *
   * @param tenantId - The ID of the tenant.
   * @param {string} name - The name of the group.
   * @param {string} description - The description of the group.
   * @returns {Promise<Group>} The created group.
   */
  const addGroup = async (
    tenantId: TenantId,
    name: string,
    description: string,
  ) => {
    const apiResponse = await groupService.createGroup(
      tenantId,
      name,
      description,
    )
    if (
      apiResponse === null ||
      apiResponse?.data === null ||
      apiResponse?.data?.data === null ||
      apiResponse?.data?.data?.group === null
    ) {
      throw new ServerError(
        'Server did not return a group please try again later.',
      )
    }
    const group = Group.fromApiData(apiResponse)

    return upsertGroup(group)
  }

  /**
   * Adds a user to a group.
   *
   * @param tenantId - The ID of the tenant.
   * @param groupId - The ID of the group.
   * @param {User} user - The user to add to the group.
   * @throws {Error} If the group is not found in the store.
   * @returns {Promise<void>}
   */
  const addGroupUser = async (
    tenantId: TenantId,
    groupId: GroupId,
    user: User,
  ) => {
    // Grab the existing group from the store, to confirm the ID and for use
    // later.
    const group = getGroup(groupId)
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`)
    }

    const apiResponse = await groupService.addUserToGroup(
      tenantId,
      groupId,
      user,
    )

    // Update group users after adding
    const addedUser = GroupUser.fromApiData(apiResponse)
    group.groupUsers.push(addedUser)
  }

  /**
   * Fetches a single group from the API and updates the store.
   *
   * @param tenantId - The ID of the tenant.
   * @param groupId - The ID of the group.
   * @returns {Promise<Group>} The fetched group.
   */
  const fetchGroup = async (tenantId: TenantId, groupId: GroupId) => {
    loading.value = true
    try {
      const groupData = await groupService.getGroup(tenantId, groupId)
      const group = Group.fromApiData(groupData)

      return upsertGroup(group)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches all groups for a tenant from the API and updates the store.
   *
   * @param tenantId - The ID of the tenant.
   * @returns {Promise<void>}
   */
  const fetchGroups = async (tenantId: TenantId) => {
    loading.value = true
    try {
      const groupList = await groupService.getTenantGroups(tenantId)
      groups.value = groupList.map(Group.fromApiData)
    } finally {
      loading.value = false
    }
  }

  /**
   * Retrieves a group by its ID from the store.
   *
   * @param groupId - The ID of the group.
   * @returns {Group|undefined} The group if found, otherwise undefined.
   */
  function getGroup(groupId: GroupId): Group | undefined {
    return groups.value.find((g) => g.id === groupId)
  }

  /**
   * Removes a user from a group.
   *
   * @param tenantId - The ID of the tenant.
   * @param groupId - The ID of the group.
   * @param groupUserId - The ID of the user in the group.
   * @throws {Error} If the group is not found in the store.
   * @returns {Promise<void>}
   */
  const removeGroupUser = async (
    tenantId: TenantId,
    groupId: GroupId,
    groupUserId: GroupUserId,
  ) => {
    // Grab the existing group from the store, to confirm the ID and for use
    // later.
    const group = getGroup(groupId)
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`)
    }

    await groupService.removeUserFromGroup(tenantId, groupId, groupUserId)

    // Update group users after removing
    const userIndex = group.groupUsers.findIndex((gu) => gu.id === groupUserId)
    if (userIndex !== -1) {
      group.groupUsers.splice(userIndex, 1)
    }
  }

  /**
   * Updates the details of a group.
   *
   * @param tenantId - The ID of the tenant.
   * @param groupId - The ID of the group.
   * @param {GroupDetailFields} groupDetails - The new group details.
   * @throws {Error} If the group is not found in the store.
   * @returns {Promise<void>}
   */
  const updateGroupDetails = async (
    tenantId: TenantId,
    groupId: GroupId,
    groupDetails: GroupDetailFields,
  ) => {
    // Grab the existing group from the store, to confirm the ID and for use
    // later.
    const group = getGroup(groupId)
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`)
    }

    const apiResponse = await groupService.updateGroup(
      tenantId,
      groupId,
      groupDetails.name,
      groupDetails.description,
    )

    const updatedGroup = Group.fromApiData(apiResponse)

    // Update the group details in the store
    group.name = updatedGroup.name
    group.description = updatedGroup.description
  }

  /**
   * Get the group service roles from the api (includes whether or not they are enabled).
   *
   * @param tenantId - The ID of the tenant.
   * @param groupId - The ID of the group.
   * @throws {Error} If the group is not found in the store.
   * @returns {Promise<void>}
   */
  const fetchRoles = async (tenantId: TenantId, groupId: GroupId) => {
    // Grab the existing group from the store, to confirm the ID and for use
    // later.
    const group = getGroup(groupId)
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`)
    }

    const apiResponse = await serviceService.getTenantGroupServices(
      tenantId,
      groupId,
    )
    groupRoles.value = {}
    for (const d of apiResponse) {
      const ind = []
      for (const r of d.sharedServiceRoles) {
        const role = ServiceRole.fromApiData(r)
        ind.push(role)
      }
      groupRoles.value[d.id] = ind
    }
  }

  /**
   * Updates the roles of a group.
   *
   * @param tenantId - The ID of the tenant.
   * @param groupId - The ID of the group.
   * @param {GroupServiceRoles} data - The new group service roles.
   * @throws {Error} If the group is not found in the store.
   * @returns {Promise<void>}
   */
  const updateRoles = async (
    tenantId: TenantId,
    groupId: GroupId,
    data: GroupServiceRole,
  ) => {
    // Grab the existing group from the store, to confirm the ID and for use
    // later.
    const group = getGroup(groupId)
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`)
    }

    await serviceService.updateTenantGroupServices(tenantId, groupId, data)
  }

  return {
    loading,
    groups,
    groupRoles,

    addGroup,
    addGroupUser,
    fetchGroup,
    fetchGroups,
    getGroup,
    removeGroupUser,
    updateGroupDetails,
    fetchRoles,
    updateRoles,
  }
})
