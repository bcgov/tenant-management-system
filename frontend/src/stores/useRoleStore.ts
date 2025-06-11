import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Role } from '@/models/role.model'
import { roleService } from '@/services/role.service'

export const useRoleStore = defineStore('role', () => {
  const roles = ref<Role[]>([])

  const loading = ref(false)

  // Exported Methods

  const fetchRoles = async () => {
    loading.value = true
    try {
      const roleList = await roleService.getRoles()
      roles.value = roleList.map(Role.fromApiData)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    roles,

    fetchRoles,
  }
})
