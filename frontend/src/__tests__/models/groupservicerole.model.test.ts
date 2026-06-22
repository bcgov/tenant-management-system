import { describe, expect, it } from 'vitest'

import {
  GroupServiceRole,
  toGroupServiceRoleId,
} from '@/models/groupservicerole.model'

describe('GroupServiceRole model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const groupServiceRole = new GroupServiceRole({
        description: 'description',
        id: toGroupServiceRoleId('id'),
        identityProviders: ['identityProvider'],
        isEnabled: true,
        name: 'name',
      })

      expect(groupServiceRole.description).toBe('description')
      expect(groupServiceRole.id).toBe('id')
      expect(groupServiceRole.identityProviders.length).toBe(1)
      expect(groupServiceRole.identityProviders[0]).toBe('identityProvider')
      expect(groupServiceRole.isEnabled).toBe(true)
      expect(groupServiceRole.name).toBe('name')
    })

    it('handles empty allowed identity providers', () => {
      const groupServiceRole = new GroupServiceRole({
        description: 'description',
        id: toGroupServiceRoleId('id'),
        identityProviders: [],
        isEnabled: true,
        name: 'name',
      })

      expect(groupServiceRole.identityProviders.length).toBe(0)
    })
  })
})
