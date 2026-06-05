import { describe, expect, it } from 'vitest'

import {
  makeServiceRole,
  makeServiceRoleApiData,
} from '@/__tests__/__factories__'

import {
  Service,
  type ServiceApiData,
  toServiceId,
} from '@/models/service.model'
import { ServiceRole } from '@/models/servicerole.model'

describe('Service model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const serviceRole = makeServiceRole()
      const service = new Service(
        toServiceId('id'),
        'name',
        'displayName',
        'createdDate',
        'clientIdentifier',
        'landingPageUrl',
        'description',
        'updatedDate',
        [serviceRole],
      )

      expect(service.clientIdentifier).toBe('clientIdentifier')
      expect(service.createdDate).toBe('createdDate')
      expect(service.description).toBe('description')
      expect(service.displayName).toBe('displayName')
      expect(service.id).toBe('id')
      expect(service.landingPageUrl).toBe('landingPageUrl')
      expect(service.name).toBe('name')
      expect(service.roles.length).toBe(1)
      expect(service.roles[0]).toBe(serviceRole)
      expect(service.updatedDate).toBe('updatedDate')
    })
  })

  describe('fromApiData', () => {
    it('creates instance', () => {
      const serviceRoleApiData = makeServiceRoleApiData()
      const serviceRole = ServiceRole.fromApiData(serviceRoleApiData)
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

      const service = Service.fromApiData(apiData)

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
