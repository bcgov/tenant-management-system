import { defineStore } from 'pinia'
import { ref } from 'vue'

import { TenantRequest, type TenantRequestDetailFields, User } from '@/models'
import { tenantRequestService } from '@/services'

/**
 * Pinia store for managing tenant requests and their statuses.
 */
export const useTenantRequestStore = defineStore('tenantRequest', () => {
  const loading = ref(false)
  const tenantRequests = ref<TenantRequest[]>([])

  /**
   * Creates a new tenant request.
   *
   * @param {TenantRequestDetailFields} tenantRequestDetails - The details of
   *   the tenant request.
   * @param {User} user - The user creating the request.
   * @returns {Promise<void>}
   */
  const createTenantRequest = async (
    tenantRequestDetails: TenantRequestDetailFields,
    user: User,
  ) => {
    await tenantRequestService.createTenantRequest(tenantRequestDetails, user)
  }

  /**
   * Fetches all tenant requests from the API and updates the store.
   *
   * @returns {Promise<void>}
   */
  const fetchTenantRequests = async () => {
    loading.value = true
    try {
      const tenantList = await tenantRequestService.getTenantRequests()
      tenantRequests.value = tenantList.map(TenantRequest.fromApiData)
    } finally {
      loading.value = false
    }
  }

  /**
   * Updates the status of a tenant request and optionally sets a rejection
   * reason.
   *
   * @param {string} tenantRequestId - The ID of the tenant request.
   * @param {string} status - The new status for the tenant request.
   * @param {string} [rejectionReason] - The reason for rejection, if any.
   * @returns {Promise<void>}
   */
  const updateTenantRequestStatus = async (
    tenantRequestId: string,
    status: string,
    rejectionReason?: string,
    tenantName?: string,
  ) => {
    await tenantRequestService.updateTenantRequestStatus(
      tenantRequestId,
      status,
      rejectionReason,
      tenantName,
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
