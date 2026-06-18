import { describe, expect, it } from 'vitest'

import { TenantRequest, toTenantRequestId } from '@/models/tenantrequest.model'

describe('TenantRequest model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const tenantRequest = new TenantRequest({
        createdBy: 'createdBy',
        createdDate: 'createdDate',
        description: 'description',
        id: toTenantRequestId('id'),
        ministryName: 'ministryName',
        name: 'name',
        rejectionReason: 'rejectionReason',
        status: 'status',
      })

      expect(tenantRequest.createdBy).toBe('createdBy')
      expect(tenantRequest.createdDate).toBe('createdDate')
      expect(tenantRequest.description).toBe('description')
      expect(tenantRequest.id).toBe('id')
      expect(tenantRequest.ministryName).toBe('ministryName')
      expect(tenantRequest.name).toBe('name')
      expect(tenantRequest.rejectionReason).toBe('rejectionReason')
      expect(tenantRequest.status).toBe('status')
    })

    it('handles empty rejection reason', () => {
      const tenantRequest = new TenantRequest({
        createdBy: 'createdBy',
        createdDate: 'createdDate',
        description: 'description',
        id: toTenantRequestId('id'),
        ministryName: 'ministryName',
        name: 'name',
        status: 'status',
      })

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
})
