import { vi } from 'vitest'
import { reactive } from 'vue'

import type { Tenant } from '@/models/tenant.model'

const mockFetchTenants = vi.fn()

const storeState = reactive({
  tenants: [] as Tenant[],
})

vi.mock('@/stores/useTenantStore', () => ({
  useTenantStore: () => ({
    get tenants() {
      return storeState.tenants
    },
    fetchTenants: mockFetchTenants,
  }),
}))

export function mockTenantStore(tenants: Tenant[] = []) {
  storeState.tenants = tenants
  mockFetchTenants.mockResolvedValue(undefined)
}

export function mockTenantStoreFetchError(error = new Error('Failed')) {
  mockFetchTenants.mockRejectedValue(error)
}

export const mockTenantStoreFetchTenants = mockFetchTenants
