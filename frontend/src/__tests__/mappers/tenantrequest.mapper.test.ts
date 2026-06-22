import { describe, expect, it } from 'vitest'

import {
  type TenantRequestApiData,
  tenantRequestMapper,
} from '@/mappers/tenantrequest.mapper'
import { TenantRequest, toTenantRequestId } from '@/models/tenantrequest.model'

describe('TenantRequest mapper', () => {
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

      const tenantRequest = tenantRequestMapper.fromApiData(apiData)

      expect(tenantRequest).toBeInstanceOf(TenantRequest)
      expect(tenantRequest.createdBy).toBe('createdBy')
      expect(tenantRequest.createdDate).toBe('createdDateTime')
      expect(tenantRequest.description).toBe('description')
      expect(tenantRequest.id).toBe('id')
      expect(tenantRequest.ministryName).toBe('ministryName')
      expect(tenantRequest.name).toBe('name')
      expect(tenantRequest.rejectionReason).toBe('rejectionReason')
      expect(tenantRequest.status).toBe('status')
    })

    it('handles created by user name', () => {
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

      const tenantRequest = tenantRequestMapper.fromApiData(apiData)

      expect(tenantRequest).toBeInstanceOf(TenantRequest)
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

      const tenantRequest = tenantRequestMapper.fromApiData(apiData)

      expect(tenantRequest).toBeInstanceOf(TenantRequest)
      expect(tenantRequest.rejectionReason).toBe('')
    })
  })
})
