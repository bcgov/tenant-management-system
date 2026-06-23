import { describe, expect, it } from 'vitest'

import { makeServiceRole } from '@/__tests__/__factories__'

import { Service, toServiceId } from '@/models/service.model'

describe('Service model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const serviceRole = makeServiceRole()
      const service = new Service({
        clientIdentifier: 'clientIdentifier',
        createdDate: 'createdDate',
        description: 'description',
        displayName: 'displayName',
        id: toServiceId('id'),
        landingPageUrl: 'landingPageUrl',
        name: 'name',
        roles: [serviceRole],
        updatedDate: 'updatedDate',
      })

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

    it('handles empty service roles', () => {
      const service = new Service({
        clientIdentifier: 'clientIdentifier',
        createdDate: 'createdDate',
        description: 'description',
        displayName: 'displayName',
        id: toServiceId('id'),
        landingPageUrl: 'landingPageUrl',
        name: 'name',
        roles: [],
        updatedDate: 'updatedDate',
      })

      expect(service.roles.length).toBe(0)
    })
  })
})
