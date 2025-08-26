import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Role } from '@/models'
import { roleService } from '@/services'

/**
 * Pinia store for managing application roles.
 */
export const useRoleStore = defineStore('role', () => {
  const roles = ref<Role[]>([])

  const loading = ref(false)

  // Exported Methods

  /**
   * Fetches all roles from the API and updates the store.
   *
   * @returns {Promise<void>}
   */
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
