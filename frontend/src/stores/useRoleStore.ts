import { defineStore } from 'pinia'
import { ref } from 'vue'

import { roleMapper } from '@/mappers/role.mapper'
import { Role } from '@/models/role.model'
import { roleService } from '@/services/role.service'

/**
 * Pinia store for managing application roles.
 */
export const useRoleStore = defineStore('role', () => {
  const loading = ref(false)
  const roles = ref<Role[]>([])

  // Exported Methods

  /**
   * Fetches all roles from the API and updates the store.
   *
   * @returns A promise that resolves when the roles are fetched and the store
   *   is updated.
   */
  const fetchRoles = async (): Promise<void> => {
    loading.value = true
    try {
      const roleData = await roleService.getRoles()
      roles.value = roleData.map(roleMapper.fromApiData)
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
