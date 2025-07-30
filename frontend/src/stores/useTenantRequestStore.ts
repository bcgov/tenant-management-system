import { defineStore } from 'pinia'
import { ref } from 'vue'

import { TenantRequest, type TenantRequestDetailFields, User } from '@/models'
import { tenantRequestService } from '@/services'

export const useTenantRequestStore = defineStore('tenantRequest', () => {
  const loading = ref(false)
  const tenantRequests = ref<TenantRequest[]>([])

  const createTenantRequest = async (
    tenantRequestDetails: TenantRequestDetailFields,
    user: User,
  ) => {
    await tenantRequestService.createTenantRequest(tenantRequestDetails, user)
  }

  const fetchTenantRequests = async () => {
    loading.value = true
    try {
      const tenantList = await tenantRequestService.getTenantRequests()
      tenantRequests.value = tenantList.map(TenantRequest.fromApiData)
    } finally {
      loading.value = false
    }
  }

  const updateTenantRequestStatus = async (
    tenantRequestId: string,
    status: string,
    rejectionReason?: string,
  ) => {
    await tenantRequestService.updateTenantRequestStatus(
      tenantRequestId,
      status,
      rejectionReason,
    )

    const tenantRequest = tenantRequests.value.find(
      (request) => request.id === tenantRequestId,
    )

    if (tenantRequest) {
      tenantRequest.status = status
      if (rejectionReason) {
        tenantRequest.rejectionReason = rejectionReason
      }
    }
  }

  return {
    loading,
    tenantRequests,

    createTenantRequest,
    fetchTenantRequests,
    updateTenantRequestStatus,
  }
})
