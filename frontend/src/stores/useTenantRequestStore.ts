import { defineStore } from 'pinia'
import { ref } from 'vue'

import { TenantRequest, type TenantRequestDetailFields, User } from '@/models'
import { tenantRequestService } from '@/services'

export const useTenantRequestStore = defineStore('tenantRequest', () => {
  const loading = ref(false)
  const tenantRequests = ref<TenantRequest[]>([])

  const fetchTenantRequests = async () => {
    loading.value = true
    try {
      const tenantList = await tenantRequestService.getTenantRequests()
      tenantRequests.value = tenantList.map(TenantRequest.fromApiData)
    } finally {
      loading.value = false
    }
  }

  const createTenantRequest = async (
    tenantRequestDetails: TenantRequestDetailFields,
    user: User,
  ) => {
    await tenantRequestService.createTenantRequest(tenantRequestDetails, user)
  }

  return {
    loading,
    tenantRequests,

    createTenantRequest,
    fetchTenantRequests,
  }
})
