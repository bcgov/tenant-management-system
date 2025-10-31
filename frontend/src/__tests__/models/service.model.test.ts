import { describe, it, expect } from 'vitest'
import { Service } from '@/models'

describe('Service model', () => {
  it('constructor assigns all properties correctly', () => {
    const service = new Service(
      'service123',
      'My Service',
      '2025-08-01',
      '',
      '',
      '',
      false,
      '',
      [],
    )

    expect(service.id).toBe('service123')
    expect(service.name).toBe('My Service')
    expect(service.createdDate).toBe('2025-08-01')
  })

  it('fromApiData creates Service instance correctly', () => {
    const apiData = {
      id: 'service456',
      name: 'API Service',
      createdDateTime: '2025-08-01',
      clientIdentifier: 'client-789',
      createdBy: 'user-123',
      description: 'A service from API',
      isActive: true,
      updatedDateTime: '2025-08-02',
      serviceRoles: [],
      roles: [],
    }

    const service = Service.fromApiData(apiData)

    expect(service).toBeInstanceOf(Service)
    expect(service.id).toBe(apiData.id)
    expect(service.name).toBe(apiData.name)
    expect(service.createdDate).toBe(apiData.createdDateTime)
  })
})
