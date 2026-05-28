import { describe, expect, it } from 'vitest'

import {
  TenantRequest,
  type TenantRequestApiData,
  toTenantRequestId,
} from '@/models/tenantrequest.model'

describe('TenantRequest model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const tenantRequest = new TenantRequest(
        'createdBy',
        'createdDate',
        'description',
        toTenantRequestId('id'),
        'name',
        'ministryName',
        'status',
      )

      expect(tenantRequest.createdBy).toBe('createdBy')
      expect(tenantRequest.createdDate).toBe('createdDate')
      expect(tenantRequest.description).toBe('description')
      expect(tenantRequest.id).toBe('id')
      expect(tenantRequest.ministryName).toBe('ministryName')
      expect(tenantRequest.name).toBe('name')
      expect(tenantRequest.rejectionReason).toBe('')
      expect(tenantRequest.status).toBe('status')
    })
  })

  describe('fromApiData', () => {
    it('creates instance', () => {
      const apiData: TenantRequestApiData = {
        createdBy: 'createdBy',
        createdDateTime: 'createdDateTime',
        description: 'description',
        id: toTenantRequestId('id'),
        ministryName: 'ministryName',
        name: 'name',
        rejectionReason: 'rejectionReason',
        status: 'status',
      }

      const tenantRequest = TenantRequest.fromApiData(apiData)

      expect(tenantRequest.createdBy).toBe('createdBy')
      expect(tenantRequest.createdDate).toBe('createdDateTime')
      expect(tenantRequest.description).toBe('description')
      expect(tenantRequest.id).toBe('id')
      expect(tenantRequest.ministryName).toBe('ministryName')
      expect(tenantRequest.name).toBe('name')
      expect(tenantRequest.rejectionReason).toBe('rejectionReason')
      expect(tenantRequest.status).toBe('status')
    })

    it('handles created by username', () => {
      const apiData: TenantRequestApiData = {
        createdBy: 'createdBy',
        createdByUserName: 'createdByUserName',
        createdDateTime: 'createdDateTime',
        description: 'description',
        id: toTenantRequestId('id'),
        ministryName: 'ministryName',
        name: 'name',
        rejectionReason: 'rejectionReason',
        status: 'status',
      }

      const tenantRequest = TenantRequest.fromApiData(apiData)

      expect(tenantRequest.createdBy).toBe('createdByUserName')
    })

    it('sets rejectionReason to empty string if missing', () => {
      const apiData: TenantRequestApiData = {
        createdBy: 'createdBy',
        createdDateTime: 'createdDateTime',
        description: 'description',
        id: toTenantRequestId('id'),
        ministryName: 'ministryName',
        name: 'name',
        status: 'status',
      }

      const tenantRequest = TenantRequest.fromApiData(apiData)

      expect(tenantRequest.rejectionReason).toBe('')
    })
  })
})
