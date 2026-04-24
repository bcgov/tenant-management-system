import { vi } from 'vitest'

const mockCreateTenantRequest = vi.fn()

vi.mock('@/stores/useTenantRequestStore', () => ({
  useTenantRequestStore: () => ({
    createTenantRequest: mockCreateTenantRequest,
  }),
}))

export function mockTenantRequestStore() {
  mockCreateTenantRequest.mockResolvedValue(undefined)
}

export const mockTenantRequestStoreCreateTenantRequest = mockCreateTenantRequest

export function mockTenantRequestStoreError(error: Error) {
  mockCreateTenantRequest.mockRejectedValue(error)
}
