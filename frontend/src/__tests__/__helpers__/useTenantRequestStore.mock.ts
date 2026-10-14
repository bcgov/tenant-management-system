import { vi } from 'vitest'
import { reactive } from 'vue'

import { type TenantRequest } from '@/models/tenantrequest.model'

const mockCreateTenantRequest = vi.fn()
const mockFetchPendingTenantRequests = vi.fn()

const storeState = reactive({
  pendingTenantRequests: [] as TenantRequest[],
  tenantRequests: [] as TenantRequest[],
})

vi.mock('@/stores/useTenantRequestStore', () => ({
  useTenantRequestStore: () => ({
    get pendingTenantRequests() {
      return storeState.pendingTenantRequests
    },
    createTenantRequest: mockCreateTenantRequest,
    fetchPendingTenantRequests: mockFetchPendingTenantRequests,
  }),
}))

export const mockTenantRequestStore = (
  pendingTenantRequests: TenantRequest[] = [],
  tenantRequests: TenantRequest[] = [],
) => {
  storeState.pendingTenantRequests = pendingTenantRequests
  storeState.tenantRequests = tenantRequests
  mockCreateTenantRequest.mockResolvedValue(undefined)
  mockFetchPendingTenantRequests.mockResolvedValue(undefined)
}

export const mockTenantRequestStoreCreateTenantRequest = mockCreateTenantRequest

export const mockTenantRequestStoreFetchPendingTenantRequests =
  mockFetchPendingTenantRequests

export const mockTenantRequestStoreError = (error: Error) => {
  mockCreateTenantRequest.mockRejectedValue(error)
  mockFetchPendingTenantRequests.mockRejectedValue(error)
}
