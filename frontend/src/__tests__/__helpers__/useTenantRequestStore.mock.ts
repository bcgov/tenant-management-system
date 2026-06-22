import { vi } from 'vitest'

const mockCreateTenantRequest = vi.fn()

vi.mock('@/stores/useTenantRequestStore', () => ({
  useTenantRequestStore: () => ({
    createTenantRequest: mockCreateTenantRequest,
  }),
}))

export const mockTenantRequestStore = () => {
  mockCreateTenantRequest.mockResolvedValue(undefined)
}

export const mockTenantRequestStoreCreateTenantRequest = mockCreateTenantRequest

export const mockTenantRequestStoreError = (error: Error) => {
  mockCreateTenantRequest.mockRejectedValue(error)
}
