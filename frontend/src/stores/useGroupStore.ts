import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Group, type GroupDetailFields, User } from '@/models'
import { groupService } from '@/services'

export const useGroupStore = defineStore('group', () => {
  const loading = ref(false)
  const groups = ref<Group[]>([])

  // Private methods

  function upsertGroup(group: Group) {
    const index = groups.value.findIndex((g) => g.id === group.id)
    if (index !== -1) {
      groups.value[index] = group
    } else {
      groups.value.push(group)
    }

    return group
  }

  // Exported Methods

  const addGroup = async (
    tenantId: string,
    name: string,
    description: string,
  ) => {
    const apiResponse = await groupService.createGroup(
      tenantId,
      name,
      description,
    )
    const group = Group.fromApiData(apiResponse)

    return upsertGroup(group)
  }

  const addUserToGroup = async (
    tenantId: string,
    groupId: string,
    user: User,
  ) => {
    const apiResponse = await groupService.addUserToGroup(
      tenantId,
      groupId,
      user,
    )

    return apiResponse
  }

  const fetchGroup = async (tenantId: string, groupId: string) => {
    loading.value = true
    try {
      const groupData = await groupService.getGroup(tenantId, groupId)
      const group = Group.fromApiData(groupData)

      return upsertGroup(group)
    } finally {
      loading.value = false
    }
  }

  const fetchGroups = async (tenantId: string) => {
    loading.value = true
    try {
      const groupList = await groupService.getTenantGroups(tenantId)
      groups.value = groupList.map(Group.fromApiData)
    } finally {
      loading.value = false
    }
  }

  function getGroup(groupId: string): Group | undefined {
    return groups.value.find((g) => g.id === groupId)
  }

  const updateGroupDetails = async (
    tenantId: string,
    groupId: string,
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

    group.name = updatedGroup.name
    group.description = updatedGroup.description
  }

  return {
    loading,
    groups,

    addGroup,
    addUserToGroup,
    fetchGroup,
    fetchGroups,
    getGroup,
    updateGroupDetails,
  }
})
