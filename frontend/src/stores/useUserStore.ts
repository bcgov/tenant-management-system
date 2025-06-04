import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNotification } from '@/composables/useNotification'
import { userService } from '@/services/user.service'
import type { Tenant } from '@/models/tenant.model'
import type { User } from '@/models/user.model'
import type { IdirSearchParameters } from '@/types/IdirSearchParameters'

export const useUserStore = defineStore('user', () => {
  const userTenants = ref<Tenant[]>([])
  const searchResults = ref<User[]>([])
  const loading = ref(false)

  const { addNotification } = useNotification()

  async function fetchUserTenants() {
    const authStore = useAuthStore()
    if (!authStore.user?.id) {
      addNotification('User ID is not available', 'error')
      throw new Error('User ID is not available')
    }

    loading.value = true
    try {
      userTenants.value = await userService.getUserTenants(authStore.user.id)
    } catch (error) {
      addNotification('Error fetching user tenants', 'error')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function searchIdirUsers(params: IdirSearchParameters) {
    loading.value = true
    try {
      searchResults.value = await userService.searchIdirUsers(params)
      return searchResults.value
    } catch (error) {
      addNotification('Error searching IDIR users', 'error')
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    userTenants,
    searchResults,
    loading,
    fetchUserTenants,
    searchIdirUsers,
  }
})
