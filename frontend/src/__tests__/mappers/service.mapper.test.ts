import { describe, expect, it } from 'vitest'

import { makeServiceRoleApiData } from '@/__tests__/__factories__'

import { serviceRoleMapper } from '@/mappers/servicerole.mapper'
import { type ServiceApiData, serviceMapper } from '@/mappers/service.mapper'
import { Service, toServiceId } from '@/models/service.model'

describe('Service mapper', () => {
  describe('fromApiData', () => {
    it('creates instance', () => {
      const serviceRoleApiData = makeServiceRoleApiData()
      const serviceRole = serviceRoleMapper.fromApiData(serviceRoleApiData)
      const apiData: ServiceApiData = {
        id: toServiceId('id'),
        displayName: 'displayName',
        createdDateTime: 'createdDateTime',
        clientIdentifier: 'clientIdentifier',
        description: 'description',
        landingPageUrl: 'landingPageUrl',
        name: 'name',
        roles: [serviceRoleApiData],
        updatedDateTime: 'updatedDateTime',
      }

      const service = serviceMapper.fromApiData(apiData)

      expect(service).toBeInstanceOf(Service)
      expect(service.createdDate).toBe('createdDateTime')
      expect(service.clientIdentifier).toBe('clientIdentifier')
      expect(service.description).toBe('description')
      expect(service.displayName).toBe('displayName')
      expect(service.id).toBe('id')
      expect(service.landingPageUrl).toBe('landingPageUrl')
      expect(service.name).toBe('name')
      expect(service.roles.length).toBe(1)
      expect(service.roles[0]).toEqual(serviceRole)
    })
  })
})
