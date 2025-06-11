import { defineStore } from 'pinia'
import { ref } from 'vue'

import { useNotification } from '@/composables/useNotification'
import { User } from '@/models/user.model'
import { userService } from '@/services/user.service'
import type { IdirSearchParameters } from '@/types/IdirSearchParameters'

export const useUserStore = defineStore('user', () => {
  const searchResults = ref<User[]>([])
  const loading = ref(false)

  const { addNotification } = useNotification()

  async function searchIdirUsers(params: IdirSearchParameters) {
    loading.value = true
    try {
      const response = await userService.searchIdirUsers(params)
      searchResults.value = response.map(User.fromSearchData)

      return searchResults.value
    } catch (error) {
      addNotification('Error searching IDIR users', 'error')

      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    searchResults,

    searchIdirUsers,
  }
})
