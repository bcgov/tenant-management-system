import { describe, expect, it } from 'vitest'
import { GroupServiceRoles, SharedServicesArray, SharedServiceRoles } from '@/models'

const sharedServicesRole :SharedServiceRoles = new SharedServiceRoles('role1', true)
const sharedServicesRole2 :SharedServiceRoles = new SharedServiceRoles('role2', false)
const sharedServicesArray :SharedServicesArray = new SharedServicesArray('service1', [sharedServicesRole, sharedServicesRole2])
const groupServiceRoles :GroupServiceRoles = new GroupServiceRoles([sharedServicesArray])

describe('SharedServiceRoles model', () => {

  it('constructor assigns all properties correctly', () => {
    expect(sharedServicesRole.id).toEqual('role1')
    expect(sharedServicesRole.enabled).toBe(true)
  })

  
})

describe('SharedServicesArray model', () => {

  it('constructor assigns all properties correctly', () => {
    expect(sharedServicesArray.id).toEqual('service1')
    expect(sharedServicesArray.sharedServiceRoles[0].id).toBe('role1')
    expect(sharedServicesArray.sharedServiceRoles[0].enabled).toBe(true)
    expect(sharedServicesArray.sharedServiceRoles[1].id).toBe('role2')
    expect(sharedServicesArray.sharedServiceRoles[1].enabled).toBe(false)
  })

  
})

describe('GroupServiceRoles model', () => {

  it('constructor assigns all properties correctly', () => {
    expect(groupServiceRoles.sharedServices[0].id).toEqual('service1')
    expect(groupServiceRoles.sharedServices[0].sharedServiceRoles[0].id).toEqual('role1')
    expect(groupServiceRoles.sharedServices[0].sharedServiceRoles[0].enabled).toEqual(true)
    expect(groupServiceRoles.sharedServices[0].sharedServiceRoles[1].id).toEqual('role2')
    expect(groupServiceRoles.sharedServices[0].sharedServiceRoles[1].enabled).toEqual(false)
  })

  
})
