import { describe, expect, it } from 'vitest'

import { Role, type RoleApiData, toRoleId } from '@/models/role.model'

describe('Role model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const role = new Role(toRoleId('id'), 'name', 'description')

      expect(role.description).toBe('description')
      expect(role.id).toBe('id')
      expect(role.name).toBe('name')
    })
  })

  describe('fromApiData', () => {
    it('creates instance', () => {
      const apiData: RoleApiData = {
        description: 'description',
        id: toRoleId('id'),
        name: 'name',
      }

      const role = Role.fromApiData(apiData)

      expect(role).toBeInstanceOf(Role)
      expect(role.description).toBe('description')
      expect(role.id).toBe('id')
      expect(role.name).toBe('name')
    })
  })
})
