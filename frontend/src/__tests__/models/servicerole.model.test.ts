import { describe, expect, it } from 'vitest'

import { ServiceRole, toServiceRoleId } from '@/models/servicerole.model'

describe('ServiceRole model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const serviceRole = new ServiceRole({
        createdBy: 'createdBy',
        createdDate: 'createdDate',
        description: 'description',
        id: toServiceRoleId('id'),
        identityProviders: ['identityProvider'],
        isDeleted: true,
        name: 'name',
      })

      expect(serviceRole.createdBy).toBe('createdBy')
      expect(serviceRole.createdDate).toBe('createdDate')
      expect(serviceRole.description).toBe('description')
      expect(serviceRole.id).toBe('id')
      expect(serviceRole.identityProviders.length).toBe(1)
      expect(serviceRole.identityProviders[0]).toBe('identityProvider')
      expect(serviceRole.isDeleted).toBe(true)
      expect(serviceRole.name).toBe('name')
    })

    it('handles empty identity providers', () => {
      const serviceRole = new ServiceRole({
        createdBy: 'createdBy',
        createdDate: 'createdDate',
        description: 'description',
        id: toServiceRoleId('id'),
        identityProviders: [],
        isDeleted: true,
        name: 'name',
      })

      expect(serviceRole.identityProviders.length).toBe(0)
    })
  })
})
