import { describe, expect, it } from 'vitest'

import { GroupServiceRole } from '@/models/groupservicerole.model'
import {
  SharedServiceRole,
  SharedServiceArray,
  type SharedServiceRoleId,
} from '@/models/sharedservicerole.model'

const sharedServiceRole: SharedServiceRole = new SharedServiceRole(
  'role1' as SharedServiceRoleId,
  true,
)
const sharedServiceRole2: SharedServiceRole = new SharedServiceRole(
  'role2' as SharedServiceRoleId,
  false,
)
const sharedServiceArray: SharedServiceArray = new SharedServiceArray(
  'service1' as SharedServiceRoleId,
  [sharedServiceRole, sharedServiceRole2],
)
const groupServiceRole: GroupServiceRole = new GroupServiceRole([
  sharedServiceArray,
])

describe('SharedServiceRole model', () => {
  it('constructor assigns all properties correctly', () => {
    expect(sharedServiceRole.id).toEqual('role1')
    expect(sharedServiceRole.enabled).toBe(true)
  })
})

describe('SharedServiceArray model', () => {
  it('constructor assigns all properties correctly', () => {
    expect(sharedServiceArray.id).toEqual('service1')
    expect(sharedServiceArray.sharedServiceRoles[0].id).toBe('role1')
    expect(sharedServiceArray.sharedServiceRoles[0].enabled).toBe(true)
    expect(sharedServiceArray.sharedServiceRoles[1].id).toBe('role2')
    expect(sharedServiceArray.sharedServiceRoles[1].enabled).toBe(false)
  })
})

describe('GroupServiceRole model', () => {
  it('constructor assigns all properties correctly', () => {
    expect(groupServiceRole.sharedServices[0].id).toEqual('service1')
    expect(groupServiceRole.sharedServices[0].sharedServiceRoles[0].id).toEqual(
      'role1',
    )
    expect(
      groupServiceRole.sharedServices[0].sharedServiceRoles[0].enabled,
    ).toEqual(true)
    expect(groupServiceRole.sharedServices[0].sharedServiceRoles[1].id).toEqual(
      'role2',
    )
    expect(
      groupServiceRole.sharedServices[0].sharedServiceRoles[1].enabled,
    ).toEqual(false)
  })
})
