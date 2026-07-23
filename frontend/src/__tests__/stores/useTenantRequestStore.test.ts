import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import {
  makeSsoUser,
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

    expect(store.loading).toBe(false)
    expect(store.tenantRequests).toEqual([])
  })

  describe('createTenantRequest', () => {
    it('does not create a tenant request in the store', async () => {
      const store = useTenantRequestStore()

      expect(store.tenantRequests).toHaveLength(0)

      await store.createTenantRequest(
        makeTenantRequestDetailFields(),
        makeUser(),
      )

      expect(store.tenantRequests).toHaveLength(0)
    })

    it.todo('creates a new tenant request in the store', async () => {
      const store = useTenantRequestStore()
      const tenantRequestDetailFields = makeTenantRequestDetailFields({
        description: 'tenantRequestDescription',
        ministryName: 'tenantRequestMinistryName',
        name: 'tenantRequestName',
      })
      const user = makeUser({
        ssoUser: makeSsoUser({
          displayName: 'ssoUserDisplayName',
          email: 'ssoUserEmail',
          firstName: 'ssoUserFirstName',
          idpType: 'ssoUserIdpType',
          lastName: 'ssoUserLastName',
          ssoUserId: toSsoUserId('ssoUserSsoUserId'),
          userName: 'ssoUserUserName',
        }),
      })

      expect(store.tenantRequests).toHaveLength(0)

      await store.createTenantRequest(tenantRequestDetailFields, user)

      expect(store.tenantRequests).toHaveLength(1)
    })
  })

  describe('fetchTenantRequests', () => {
    it('manages loading state', async () => {
      const store = useTenantRequestStore()
      vi.mocked(tenantRequestService.getTenantRequests).mockResolvedValue([
        makeTenantRequestApiData(),
      ])

      expect(store.loading).toBe(false)

      const promise = store.fetchTenantRequests()

      expect(store.loading).toBe(true)

      await promise

      expect(store.loading).toBe(false)
    })

    it('clears loading state on error', async () => {
      const store = useTenantRequestStore()
      vi.mocked(tenantRequestService.getTenantRequests).mockRejectedValueOnce(
        new Error('API error'),
      )

      expect(store.loading).toBe(false)

      await expect(store.fetchTenantRequests()).rejects.toThrow()

      expect(store.loading).toBe(false)
    })

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

    it.todo('updates name in the store if given', async () => {
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

    it('gracefully ignores updates for non-existent IDs', async () => {
      const store = useTenantRequestStore()
      store.tenantRequests = []

      await expect(
        store.updateTenantRequestStatus(
          toTenantRequestId('tenantRequestId'),
          'tenantRequestStatus',
        ),
      ).resolves.not.toThrow()
    })
  })
})
