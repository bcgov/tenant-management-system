import { describe, expect, it } from 'vitest'

import {
  type GroupServiceRoleApiData,
  groupServiceRoleMapper,
} from '@/mappers/groupservicerole.mapper'
import {
  GroupServiceRole,
  toGroupServiceRoleId,
} from '@/models/groupservicerole.model'

describe('GroupServiceRole mapper', () => {
  describe('fromApiData', () => {
    it('creates instance', () => {
      const apiData: GroupServiceRoleApiData = {
        allowedIdentityProviders: ['allowedIdentityProvider'],
        description: 'description',
        enabled: true,
        id: toGroupServiceRoleId('id'),
        name: 'name',
      }

      const groupServiceRole = groupServiceRoleMapper.fromApiData(apiData)

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

    it('handles empty allowed identity providers', () => {
      const apiData: GroupServiceRoleApiData = {
        allowedIdentityProviders: [],
        description: 'description',
        enabled: true,
        id: toGroupServiceRoleId('id'),
        name: 'name',
      }

      const groupServiceRole = groupServiceRoleMapper.fromApiData(apiData)

      expect(groupServiceRole).toBeInstanceOf(GroupServiceRole)
      expect(groupServiceRole.allowedIdentityProviders).toHaveLength(0)
    })
  })
})
