import { describe, it, expect } from 'vitest'
import { Role } from '@/models'

describe('Role model', () => {
  it('constructor assigns all properties correctly', () => {
    const role = new Role('role123', 'Admin', 'Administrator role')

    expect(role.id).toBe('role123')
    expect(role.name).toBe('Admin')
    expect(role.description).toBe('Administrator role')
  })

  it('fromApiData creates Role instance correctly', () => {
    const apiData = {
      id: 'role456',
      name: 'User',
      description: 'Standard user role',
    }

    const role = Role.fromApiData(apiData)

    expect(role).toBeInstanceOf(Role)
    expect(role.id).toBe(apiData.id)
    expect(role.name).toBe(apiData.name)
    expect(role.description).toBe(apiData.description)
  })
})
