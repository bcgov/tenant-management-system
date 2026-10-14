import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import {
  makeTenantRequest,
  makeTenantRequestApiData,
  makeTenantRequestDetailFields,
  makeUser,
} from '@/__tests__/__factories__'

import { toSsoUserId } from '@/models/ssouser.model'
import { toTenantRequestId } from '@/models/tenantrequest.model'
import { tenantRequestService } from '@/services/tenantrequest.service'
import { useTenantRequestStore } from '@/stores/useTenantRequestStore'

vi.mock('@/services/tenantrequest.service', () => ({
  tenantRequestService: {
    createTenantRequest: vi.fn(),
    getPendingTenantRequests: vi.fn(),
    getTenantRequests: vi.fn(),
    updateTenantRequestStatus: vi.fn(),
  },
}))

describe('useTenantRequestStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with default values', () => {
    const store = useTenantRequestStore()

    expect(store.pendingTenantRequests).toEqual([])
    expect(store.tenantRequests).toEqual([])
  })

  describe('createTenantRequest', () => {
    it('creates a tenant request in the store', async () => {
      const store = useTenantRequestStore()
      vi.mocked(tenantRequestService.createTenantRequest).mockResolvedValue(
        makeTenantRequestApiData(),
      )

      expect(store.pendingTenantRequests).toHaveLength(0)
      expect(store.tenantRequests).toHaveLength(0)

      await store.createTenantRequest(
        makeTenantRequestDetailFields(),
        makeUser(),
      )

      expect(store.pendingTenantRequests).toHaveLength(1)
      expect(store.tenantRequests).toHaveLength(0)
    })
  })

  describe('fetchPendingTenantRequests', () => {
    it('overwrites store with results', async () => {
      const store = useTenantRequestStore()
      const tenantRequest = makeTenantRequest({
        createdBy: 'tenantRequestCreatedBy',
        createdDate: 'tenantRequestCreatedDate',
        description: 'tenantRequestDescription',
        id: toTenantRequestId('tenantRequestId'),
        ministryName: 'tenantRequestMinistryName',
        name: 'tenantRequestName',
        status: 'tenantRequestStatus',
      })
      store.pendingTenantRequests = [tenantRequest]
      const tenantRequestApiData = makeTenantRequestApiData({
        createdBy: 'tenantRequestCreatedBy2',
        createdDateTime: 'tenantRequestCreatedDate2',
        description: 'tenantRequestDescription2',
        id: toTenantRequestId('tenantRequestId2'),
        ministryName: 'tenantRequestMinistryName2',
        name: 'tenantRequestName2',
        status: 'tenantRequestStatus2',
      })
      vi.mocked(
        tenantRequestService.getPendingTenantRequests,
      ).mockResolvedValue([tenantRequestApiData])

      expect(store.pendingTenantRequests).toHaveLength(1)

      await store.fetchPendingTenantRequests(toSsoUserId('ssouserId'))

      expect(store.pendingTenantRequests).toHaveLength(1)
      expect(store.pendingTenantRequests[0].createdBy).toBe(
        'tenantRequestCreatedBy2',
      )
      expect(store.pendingTenantRequests[0].createdDate).toBe(
        'tenantRequestCreatedDate2',
      )
      expect(store.pendingTenantRequests[0].description).toBe(
        'tenantRequestDescription2',
      )
      expect(store.pendingTenantRequests[0].id).toBe('tenantRequestId2')
      expect(store.pendingTenantRequests[0].ministryName).toBe(
        'tenantRequestMinistryName2',
      )
      expect(store.pendingTenantRequests[0].name).toBe('tenantRequestName2')
      expect(store.pendingTenantRequests[0].status).toBe('tenantRequestStatus2')
      expect(store.tenantRequests).toHaveLength(0)
    })

    it('does not alter the state on api error', async () => {
      const store = useTenantRequestStore()
      const tenantRequest = makeTenantRequest({
        id: toTenantRequestId('tenantRequestId'),
      })
      store.pendingTenantRequests = [tenantRequest]
      vi.mocked(
        tenantRequestService.getPendingTenantRequests,
      ).mockRejectedValueOnce(new Error('API error'))

      expect(store.pendingTenantRequests).toHaveLength(1)
      expect(store.pendingTenantRequests[0].id).toBe('tenantRequestId')

      await expect(
        store.fetchPendingTenantRequests(toSsoUserId('ssouserId')),
      ).rejects.toThrow()

      expect(store.pendingTenantRequests).toHaveLength(1)
      expect(store.pendingTenantRequests[0].id).toBe('tenantRequestId')
      expect(store.tenantRequests).toHaveLength(0)
    })
  })

  describe('fetchTenantRequests', () => {
    it('overwrites store with results', async () => {
      const store = useTenantRequestStore()
      const tenantRequest = makeTenantRequest({
        createdBy: 'tenantRequestCreatedBy',
        createdDate: 'tenantRequestCreatedDate',
        description: 'tenantRequestDescription',
        id: toTenantRequestId('tenantRequestId'),
        ministryName: 'tenantRequestMinistryName',
        name: 'tenantRequestName',
        status: 'tenantRequestStatus',
      })
      store.tenantRequests = [tenantRequest]
      const tenantRequestApiData = makeTenantRequestApiData({
        createdBy: 'tenantRequestCreatedBy2',
        createdDateTime: 'tenantRequestCreatedDate2',
        description: 'tenantRequestDescription2',
        id: toTenantRequestId('tenantRequestId2'),
        ministryName: 'tenantRequestMinistryName2',
        name: 'tenantRequestName2',
        status: 'tenantRequestStatus2',
      })
      vi.mocked(tenantRequestService.getTenantRequests).mockResolvedValue([
        tenantRequestApiData,
      ])

      expect(store.tenantRequests).toHaveLength(1)

      await store.fetchTenantRequests()

      expect(store.tenantRequests).toHaveLength(1)
      expect(store.tenantRequests[0].createdBy).toBe('tenantRequestCreatedBy2')
      expect(store.tenantRequests[0].createdDate).toBe(
        'tenantRequestCreatedDate2',
      )
      expect(store.tenantRequests[0].description).toBe(
        'tenantRequestDescription2',
      )
      expect(store.tenantRequests[0].id).toBe('tenantRequestId2')
      expect(store.tenantRequests[0].ministryName).toBe(
        'tenantRequestMinistryName2',
      )
      expect(store.tenantRequests[0].name).toBe('tenantRequestName2')
      expect(store.tenantRequests[0].status).toBe('tenantRequestStatus2')
      expect(store.pendingTenantRequests).toHaveLength(0)
    })

    it('does not alter the state on api error', async () => {
      const store = useTenantRequestStore()
      const tenantRequest = makeTenantRequest({
        id: toTenantRequestId('tenantRequestId'),
      })
      store.tenantRequests = [tenantRequest]
      vi.mocked(tenantRequestService.getTenantRequests).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.tenantRequests).toHaveLength(1)
      expect(store.tenantRequests[0].id).toBe('tenantRequestId')

      await expect(store.fetchTenantRequests()).rejects.toThrow()

      expect(store.tenantRequests).toHaveLength(1)
      expect(store.tenantRequests[0].id).toBe('tenantRequestId')
      expect(store.pendingTenantRequests).toHaveLength(0)
    })
  })

  describe('updateTenantRequestStatus', () => {
    it('updates status in the store', async () => {
      const store = useTenantRequestStore()
      const tenantRequest = makeTenantRequest({
        id: toTenantRequestId('tenantRequestId'),
        status: 'tenantRequestStatus',
      })
      store.tenantRequests = [tenantRequest]

      await store.updateTenantRequestStatus(
        toTenantRequestId('tenantRequestId'),
        'tenantRequestStatus2',
      )

      expect(store.tenantRequests[0].status).toBe('tenantRequestStatus2')
    })

    it('updates rejection reason in the store if given', async () => {
      const store = useTenantRequestStore()
      const tenantRequest = makeTenantRequest({
        id: toTenantRequestId('tenantRequestId'),
        rejectionReason: 'tenantRequestRejectionReason',
        status: 'tenantRequestStatus',
      })
      store.tenantRequests = [tenantRequest]

      await store.updateTenantRequestStatus(
        toTenantRequestId('tenantRequestId'),
        'tenantRequestStatus',
        'tenantRequestRejectionReason2',
      )

      expect(store.tenantRequests[0].rejectionReason).toBe(
        'tenantRequestRejectionReason2',
      )
    })

    it('updates name in the store if given', async () => {
      const store = useTenantRequestStore()
      const tenantRequest = makeTenantRequest({
        id: toTenantRequestId('tenantRequestId'),
        name: 'tenantRequestName',
        status: 'tenantRequestStatus',
      })
      store.tenantRequests = [tenantRequest]

      await store.updateTenantRequestStatus(
        toTenantRequestId('tenantRequestId'),
        'tenantRequestStatus',
        undefined,
        'tenantRequestName2',
      )

      expect(store.tenantRequests[0].name).toBe('tenantRequestName2')
    })

    it('throws an error for non-existent IDs', async () => {
      const store = useTenantRequestStore()
      store.tenantRequests = []

      await expect(
        store.updateTenantRequestStatus(
          toTenantRequestId('tenantRequestId'),
          'tenantRequestStatus',
        ),
      ).rejects.toThrow()
    })
  })
})
