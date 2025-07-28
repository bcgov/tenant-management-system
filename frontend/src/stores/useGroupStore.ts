import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Group, User } from '@/models'
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

  const fetchGroups = async (tenantId: string) => {
    loading.value = true
    try {
      const groupList = await groupService.getTenantGroups(tenantId)
      groups.value = groupList.map(Group.fromApiData)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    groups,

    addGroup,
    addUserToGroup,
    fetchGroups,
  }
})
