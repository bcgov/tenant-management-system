import { describe, expect, it } from 'vitest'

import { makeServiceRole } from '@/__tests__/__factories__'

import { Service, toServiceId } from '@/models/service.model'

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
})
