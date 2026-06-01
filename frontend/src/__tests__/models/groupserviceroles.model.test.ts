import { describe, expect, it } from 'vitest'

import {
  GroupServiceRole,
  type GroupServiceRoleApiData,
  toGroupServiceRoleId,
} from '@/models/groupservicerole.model'

describe('GroupServiceRole model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const groupServiceRole = new GroupServiceRole(
        toGroupServiceRoleId('id'),
        'name',
        'description',
        ['allowedIdentityProvider'],
        true,
      )

      expect(groupServiceRole.allowedIdentityProviders.length).toBe(1)
      expect(groupServiceRole.allowedIdentityProviders[0]).toBe(
        'allowedIdentityProvider',
      )
      expect(groupServiceRole.description).toBe('description')
      expect(groupServiceRole.id).toBe('id')
      expect(groupServiceRole.isEnabled).toBe(true)
      expect(groupServiceRole.name).toBe('name')
    })
  })

  describe('fromApiData', () => {
    it('creates instance', () => {
      const apiData: GroupServiceRoleApiData = {
        allowedIdentityProviders: ['allowedIdentityProvider'],
        description: 'description',
        enabled: true,
        id: 'id',
        name: 'name',
      }

      const groupServiceRole = GroupServiceRole.fromApiData(apiData)

      expect(groupServiceRole).toBeInstanceOf(GroupServiceRole)
      expect(groupServiceRole.allowedIdentityProviders).toHaveLength(1)
      expect(groupServiceRole.allowedIdentityProviders[0]).toBe(
        'allowedIdentityProvider',
      )
      expect(groupServiceRole.description).toBe('description')
      expect(groupServiceRole.id).toBe('id')
      expect(groupServiceRole.isEnabled).toBe(true)
      expect(groupServiceRole.name).toBe('name')
    })
  })
})
