import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { makeUser } from '@/__tests__/__factories__'

import {
  TenantRequest,
  type TenantRequestApiData,
  type TenantRequestDetailFields,
  toTenantRequestId,
} from '@/models/tenantrequest.model'
import { tenantRequestService } from '@/services/tenantrequest.service'
import { useTenantRequestStore } from '@/stores/useTenantRequestStore'

vi.mock('@/services/tenantrequest.service', () => ({
  tenantRequestService: {
    createTenantRequest: vi.fn(),
    getTenantRequests: vi.fn(),
    updateTenantRequestStatus: vi.fn(),
  },
}))

describe('Tenant Request Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with default values', () => {
    const store = useTenantRequestStore()

    expect(store.tenantRequests).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('createTenantRequest calls the service correctly', async () => {
    const store = useTenantRequestStore()
    const mockDetails: TenantRequestDetailFields = {
      description: 'Test Description',
      ministryName: 'Ministry of Testing',
      name: 'Test Tenant',
    }
    const mockUser = makeUser()

    await store.createTenantRequest(mockDetails, mockUser)

    expect(tenantRequestService.createTenantRequest).toHaveBeenCalledWith(
      mockDetails,
      mockUser,
    )
  })

  describe('fetchTenantRequests', () => {
    it('maps API data to Model correctly and handles loading state', async () => {
      const store = useTenantRequestStore()
      const mockApiData: TenantRequestApiData[] = [
        {
          id: toTenantRequestId('req-1'),
          createdBy: 'user-guid',
          createdByUserName: 'jdoe',
          createdDateTime: '2023-01-01',
          description: 'Test Desc',
          ministryName: 'Agri',
          name: 'Test Tenant',
          status: 'NEW',
        },
        {
          id: toTenantRequestId('req-2'),
          createdBy: 'fallback-user',
          createdDateTime: '2023-01-02',
          description: 'No Username',
          ministryName: 'Health',
          name: 'Guest Tenant',
          status: 'NEW',
        },
      ]
      vi.mocked(tenantRequestService.getTenantRequests).mockResolvedValue(
        mockApiData,
      )

      const promise = store.fetchTenantRequests()
      expect(store.loading).toBe(true)
      await promise

      expect(store.loading).toBe(false)
      expect(store.tenantRequests).toHaveLength(2)
      expect(store.tenantRequests[0]).toBeInstanceOf(TenantRequest)
      expect(store.tenantRequests[0].createdBy).toBe('jdoe')
      expect(store.tenantRequests[1].createdBy).toBe('fallback-user')
    })

    it('sets loading to false even if the fetch fails', async () => {
      const store = useTenantRequestStore()
      vi.mocked(tenantRequestService.getTenantRequests).mockRejectedValue(
        new Error('Fail'),
      )

      await expect(store.fetchTenantRequests()).rejects.toThrow('Fail')

      expect(store.loading).toBe(false)
    })
  })

  describe('updateTenantRequestStatus', () => {
    it('updates specific properties and service parameters', async () => {
      const store = useTenantRequestStore()
      const targetId = toTenantRequestId('target-uuid')
      const initialRequest = TenantRequest.fromApiData({
        id: targetId,
        createdBy: 'system',
        createdDateTime: '2023-01-01',
        description: 'Initial',
        ministryName: 'Finance',
        name: 'Old Name',
        status: 'NEW',
      })
      store.tenantRequests = [initialRequest]
      vi.mocked(
        tenantRequestService.updateTenantRequestStatus,
      ).mockResolvedValue(undefined)

      await store.updateTenantRequestStatus(
        targetId,
        'REJECTED',
        'Invalid docs',
        'Clash Name',
      )

      expect(
        tenantRequestService.updateTenantRequestStatus,
      ).toHaveBeenCalledWith(targetId, 'REJECTED', 'Invalid docs', 'Clash Name')

      const updated = store.tenantRequests.find(
        (r: TenantRequest) => r.id === targetId,
      )

      expect(updated?.status).toBe('REJECTED')
      expect(updated?.rejectionReason).toBe('Invalid docs')
    })

    it('does not update rejectionReason if parameter is undefined', async () => {
      const store = useTenantRequestStore()
      const targetId = toTenantRequestId('target-uuid')
      const initialRequest = TenantRequest.fromApiData({
        id: targetId,
        createdBy: 'system',
        createdDateTime: '2023-01-01',
        description: 'Initial',
        ministryName: 'Finance',
        name: 'Old Name',
        status: 'NEW',
      })
      initialRequest.rejectionReason = 'Keep Me'
      store.tenantRequests = [initialRequest]

      await store.updateTenantRequestStatus(targetId, 'APPROVED')
      const updated = store.tenantRequests.find(
        (r: TenantRequest) => r.id === targetId,
      )

      expect(updated?.status).toBe('APPROVED')
      expect(updated?.rejectionReason).toBe('Keep Me')
    })

    it('gracefully ignores updates for non-existent IDs', async () => {
      const store = useTenantRequestStore()
      store.tenantRequests = []

      await expect(
        store.updateTenantRequestStatus(toTenantRequestId('fake'), 'APPROVED'),
      ).resolves.not.toThrow()
    })
  })
})
