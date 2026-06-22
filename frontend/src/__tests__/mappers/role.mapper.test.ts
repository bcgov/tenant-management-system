import { describe, expect, it } from 'vitest'

import { type RoleApiData, roleMapper } from '@/mappers/role.mapper'
import { Role, toRoleId } from '@/models/role.model'

describe('Role mapper', () => {
  describe('fromApiData', () => {
    it('creates instance', () => {
      const apiData: RoleApiData = {
        description: 'description',
        id: toRoleId('id'),
        name: 'name',
      }

      const role = roleMapper.fromApiData(apiData)

      expect(role).toBeInstanceOf(Role)
      expect(role.description).toBe('description')
      expect(role.id).toBe('id')
      expect(role.name).toBe('name')
    })
  })
})
