import { defineStore } from 'pinia'
import { ref } from 'vue'

import { User } from '@/models'
import { userService } from '@/services'
import type { IdirSearchParameters } from '@/types'

export const useUserStore = defineStore('user', () => {
  const loading = ref(false)
  const searchResults = ref<User[]>([])

  async function searchIdirUsers(params: IdirSearchParameters) {
    loading.value = true
    try {
      const response = await userService.searchIdirUsers(params)
      searchResults.value = response.map(User.fromSearchData)

      return searchResults.value
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
