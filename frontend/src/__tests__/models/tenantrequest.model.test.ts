import { describe, expect, it } from 'vitest'

import { TenantRequest } from '@/models'

describe('TenantRequest model', () => {
  it('constructor assigns properties correctly and sets rejectionReason to empty string', () => {
    const tenantRequest = new TenantRequest(
      'creatorUser',
      '2025-08-01',
      'Request description',
      'request123',
      'Request Name',
      'Ministry',
      'NEW',
    )

    expect(tenantRequest.createdBy).toBe('creatorUser')
    expect(tenantRequest.createdDate).toBe('2025-08-01')
    expect(tenantRequest.description).toBe('Request description')
    expect(tenantRequest.id).toBe('request123')
    expect(tenantRequest.name).toBe('Request Name')
    expect(tenantRequest.ministryName).toBe('Ministry')
    expect(tenantRequest.status).toBe('NEW')
    expect(tenantRequest.rejectionReason).toBe('')
  })

  it('fromApiData creates an instance correctly including rejectionReason', () => {
    const apiData = {
      createdBy: 'creatorUser',
      createdDateTime: '2025-08-01',
      description: 'API request description',
      id: 'request456',
      name: 'API Request',
      ministryName: 'Ministry',
      status: 'REJECTED',
      rejectionReason: 'Invalid data',
    }

    const tenantRequest = TenantRequest.fromApiData(apiData)

    expect(tenantRequest.createdBy).toBe(apiData.createdBy)
    expect(tenantRequest.createdDate).toBe(apiData.createdDateTime)
    expect(tenantRequest.description).toBe(apiData.description)
    expect(tenantRequest.id).toBe(apiData.id)
    expect(tenantRequest.name).toBe(apiData.name)
    expect(tenantRequest.ministryName).toBe(apiData.ministryName)
    expect(tenantRequest.status).toBe(apiData.status)
    expect(tenantRequest.rejectionReason).toBe(apiData.rejectionReason)
  })

  it('fromApiData sets rejectionReason to empty string if missing', () => {
    const apiData = {
      createdBy: 'creatorUser',
      createdDateTime: '2025-08-01',
      description: 'API request description',
      id: 'request789',
      name: 'API Request',
      ministryName: 'Ministry',
      status: 'APPROVED',
    }

    const tenantRequest = TenantRequest.fromApiData(apiData)

    expect(tenantRequest.rejectionReason).toBe('')
  })
})
