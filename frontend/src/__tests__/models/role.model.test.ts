import { describe, expect, it } from 'vitest'

import { Role, type RoleApiData, toRoleId } from '@/models/role.model'

describe('Role model', () => {
  it('constructor assigns all properties correctly', () => {
    const role = new Role(toRoleId('role123'), 'Admin', 'Administrator role')

    expect(role.description).toBe('Administrator role')
    expect(role.id).toBe('role123')
    expect(role.name).toBe('Admin')
  })

  it('fromApiData creates Role instance correctly', () => {
    const apiData: RoleApiData = {
      description: 'Standard user role',
      id: toRoleId('role456'),
      name: 'User',
    }

    const role = Role.fromApiData(apiData)

    expect(role).toBeInstanceOf(Role)
    expect(role.description).toBe(apiData.description)
    expect(role.id).toBe(apiData.id)
    expect(role.name).toBe(apiData.name)
  })
})
