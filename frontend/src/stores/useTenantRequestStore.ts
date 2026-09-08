import { defineStore } from 'pinia'
import { ref } from 'vue'

import { tenantRequestMapper } from '@/mappers/tenantrequest.mapper'
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
  const tenantRequests = ref<TenantRequest[]>([])

  // Private methods

  /**
   * Retrieves a tenant request from the store by its ID.
   *
   * @param tenantRequestId - The ID of the tenant request.
   * @returns The tenant request if found, otherwise undefined.
   */
  const getTenantRequest = (
    tenantRequestId: TenantRequestId,
  ): TenantRequest | undefined => {
    return tenantRequests.value.find(
      (tenantRequest) => tenantRequest.id === tenantRequestId,
    )
  }

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
    const tenantRequestApiData = await tenantRequestService.getTenantRequests()
    tenantRequests.value = tenantRequestApiData.map(
      tenantRequestMapper.fromApiData,
    )
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
    // Grab the existing tenant request from the store, to confirm the ID and
    // for use later.
    const tenantRequest = getTenantRequest(tenantRequestId)
    if (!tenantRequest) {
      throw new Error(`Tenant request with ID ${tenantRequestId} not found`)
    }

    await tenantRequestService.updateTenantRequestStatus(
      tenantRequestId,
      status,
      rejectionReason,
      tenantName,
    )

    tenantRequest.name = tenantName ?? tenantRequest.name
    tenantRequest.rejectionReason = rejectionReason || ''
    tenantRequest.status = status
  }

  return {
    tenantRequests,

    createTenantRequest,
    fetchTenantRequests,
    updateTenantRequestStatus,
  }
})
