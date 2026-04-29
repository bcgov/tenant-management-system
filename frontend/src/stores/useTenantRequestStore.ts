import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  TenantRequest,
  type TenantRequestDetailFields,
  type TenantRequestId,
} from '@/models/tenantrequest.model'
import { User } from '@/models/user.model'
import { tenantRequestService } from '@/services/tenantrequest.service'

/**
 * Pinia store for managing tenant requests and their statuses.
 */
export const useTenantRequestStore = defineStore('tenantRequest', () => {
  const loading = ref(false)
  const tenantRequests = ref<TenantRequest[]>([])

  /**
   * Creates a new tenant request.
   *
   * @param tenantRequestDetails - The details of the tenant request.
   * @param user - The user creating the request.
   * @returns A promise that resolves when the tenant request is created.
   */
  const createTenantRequest = async (
    tenantRequestDetails: TenantRequestDetailFields,
    user: User,
  ): Promise<void> => {
    await tenantRequestService.createTenantRequest(tenantRequestDetails, user)
  }

  /**
   * Fetches all tenant requests from the API and updates the store.
   *
   * @returns A promise that resolves when the tenant requests are fetched and
   *   the store is updated.
   */
  const fetchTenantRequests = async (): Promise<void> => {
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
   * @param tenantRequestId - The ID of the tenant request.
   * @param status - The new status for the tenant request.
   * @param rejectionReason - Optional reason for rejection.
   * @param tenantName - Optional new tenant name, used when there is a name
   *   clash.
   * @returns A promise that resolves when the tenant request status is updated.
   */
  const updateTenantRequestStatus = async (
    tenantRequestId: TenantRequestId,
    status: string,
    rejectionReason?: string,
    tenantName?: string,
  ): Promise<void> => {
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
