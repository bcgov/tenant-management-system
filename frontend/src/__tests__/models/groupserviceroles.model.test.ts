import { describe, expect, it } from 'vitest'

import {
  GroupServiceRole,
  toGroupServiceRoleId,
} from '@/models/groupservicerole.model'

describe('GroupServiceRole model', () => {
  it('constructor assigns all properties correctly', () => {
    const groupServiceRole = new GroupServiceRole(
      toGroupServiceRoleId('group123'),
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
    expect(groupServiceRole.id).toBe('group123')
    expect(groupServiceRole.isEnabled).toBe(true)
    expect(groupServiceRole.name).toBe('name')
  })
})
