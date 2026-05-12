import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  Group,
  type GroupDetailFields,
  type GroupId,
} from '@/models/group.model'
import { GroupServiceRole } from '@/models/groupservicerole.model'
import { GroupUser, type GroupUserId } from '@/models/groupuser.model'
import { ServiceRole } from '@/models/servicerole.model'
import { type TenantId } from '@/models/tenant.model'
import { User } from '@/models/user.model'
import { groupService } from '@/services/group.service'
import { serviceService } from '@/services/service.service'

export type GroupRoleType = {
  [key: string]: ServiceRole[]
}

/**
 * Pinia store for managing groups and group users.
 */
export const useGroupStore = defineStore('group', () => {
  const groups = ref<Group[]>([])
  const groupRoles = ref<GroupRoleType>({})
  const loading = ref(false)

  // Private methods

  /**
   * Inserts or updates a group in the store.
   *
   * @param group - The group to insert or update.
   * @returns The inserted or updated group.
   */
  function upsertGroup(group: Group): Group {
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
   * @param name - The name of the group.
   * @param description - The description of the group.
   * @returns The created group.
   */
  const addGroup = async (
    tenantId: TenantId,
    name: string,
    description: string,
  ): Promise<Group> => {
    const response = await groupService.createGroup(tenantId, name, description)
    const group = Group.fromApiData(response)

    return upsertGroup(group)
  }

  /**
   * Adds a user to a group.
   *
   * @param tenantId - The ID of the tenant.
   * @param groupId - The ID of the group.
   * @param user - The user to add to the group.
   * @throws If the group is not found in the store.
   * @returns A promise that resolves when the user is added to the group.
   */
  const addGroupUser = async (
    tenantId: TenantId,
    groupId: GroupId,
    user: User,
  ): Promise<void> => {
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
   * @returns A promise that resolves to the fetched group.
   */
  const fetchGroup = async (
    tenantId: TenantId,
    groupId: GroupId,
  ): Promise<Group> => {
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
   * @returns A promise that resolves when the groups are fetched and the store
   *   is updated.
   */
  const fetchGroups = async (tenantId: TenantId): Promise<void> => {
    loading.value = true
    try {
      const groupList = await groupService.getTenantGroups(tenantId)
      groups.value = groupList.map(Group.fromApiData)
    } finally {
      loading.value = false
    }
  }

  /**
   * Get the group service roles from the api (includes whether or not they are
   * enabled).
   *
   * @param tenantId - The ID of the tenant.
   * @param groupId - The ID of the group.
   * @throws {Error} If the group is not found in the store.
   * @returns A promise that resolves when the roles are fetched.
   */
  const fetchRoles = async (
    tenantId: TenantId,
    groupId: GroupId,
  ): Promise<void> => {
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

    // TODO: untangle this insanity.
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
   * Retrieves a group by its ID from the store.
   *
   * @param groupId - The ID of the group.
   * @returns The group if found, otherwise undefined.
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
   * @returns A promise that resolves when the user is removed from the group.
   */
  const removeGroupUser = async (
    tenantId: TenantId,
    groupId: GroupId,
    groupUserId: GroupUserId,
  ): Promise<void> => {
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
   * @param groupDetails - The new group details.
   * @throws {Error} If the group is not found in the store.
   * @returns A promise that resolves when the group details are updated.
   */
  const updateGroupDetails = async (
    tenantId: TenantId,
    groupId: GroupId,
    groupDetails: GroupDetailFields,
  ): Promise<void> => {
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
   * Updates the roles of a group.
   *
   * @param tenantId - The ID of the tenant.
   * @param groupId - The ID of the group.
   * @param data - The new group service roles.
   * @throws {Error} If the group is not found in the store.
   * @returns A promise that resolves when the roles are updated.
   */
  const updateRoles = async (
    tenantId: TenantId,
    groupId: GroupId,
    data: GroupServiceRole,
  ): Promise<void> => {
    // Grab the existing group from the store, to confirm the ID and for use
    // later.
    const group = getGroup(groupId)
    if (!group) {
      throw new Error(`Group with ID ${groupId} not found`)
    }

    await serviceService.updateTenantGroupServices(tenantId, groupId, data)
  }

  return {
    groups,
    groupRoles,
    loading,

    addGroup,
    addGroupUser,
    fetchGroup,
    fetchGroups,
    fetchRoles,
    getGroup,
    removeGroupUser,
    updateGroupDetails,
    updateRoles,
  }
})
