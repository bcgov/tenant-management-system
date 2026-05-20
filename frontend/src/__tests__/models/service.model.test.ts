import { describe, expect, it } from 'vitest'

import {
  Service,
  toServiceId,
  type ServiceApiData,
} from '@/models/service.model'
import { toServiceRoleId } from '@/models/servicerole.model'

describe('Service model', () => {
  it('constructor assigns all properties correctly', () => {
    const service = new Service(
      toServiceId('service123'),
      'displayName',
      'createdDate',
      'clientIdentifier',
      'description',
      [],
    )

    expect(service.description).toBe('description')
    expect(service.displayName).toBe('displayName')
    expect(service.clientIdentifier).toBe('clientIdentifier')
    expect(service.createdDate).toBe('createdDate')
    expect(service.id).toBe('service123')
  })

  it('fromApiData creates Service instance correctly', () => {
    const apiData: ServiceApiData = {
      id: toServiceId('service456'),
      displayName: 'API Service',
      createdDateTime: '2025-08-01',
      clientIdentifier: 'client-789',
      description: 'A service from API',
      roles: [
        {
          id: toServiceRoleId('role456'),
          name: 'User',
          description: 'Standard user role',
          allowedIdentityProviders: [],
          createdBy: '',
          isDeleted: true,
          createdDateTime: '',
        },
      ],
    }

    const service = Service.fromApiData(apiData)

    expect(service).toBeInstanceOf(Service)
    expect(service.id).toBe('service456')
    expect(service.displayName).toBe('API Service')
    expect(service.createdDate).toBe('2025-08-01')
  })
})
