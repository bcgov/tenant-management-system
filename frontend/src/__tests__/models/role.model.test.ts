import { describe, expect, it } from 'vitest'

import { Role, toRoleId } from '@/models/role.model'

describe('Role model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const role = new Role(toRoleId('id'), 'name', 'description')

      expect(role.description).toBe('description')
      expect(role.id).toBe('id')
      expect(role.name).toBe('name')
    })
  })
})
