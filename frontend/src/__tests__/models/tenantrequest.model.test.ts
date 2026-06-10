import { describe, expect, it } from 'vitest'

import { TenantRequest, toTenantRequestId } from '@/models/tenantrequest.model'

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
})
