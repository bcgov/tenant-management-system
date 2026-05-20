import { describe, expect, it } from 'vitest'

import {
  makeGroupService,
  makeGroupServiceRole,
} from '@/__tests__/__factories__'

import {
  GroupService,
  type GroupServiceApiData,
  toGroupServiceId,
} from '@/models/groupservice.model'
import { toGroupServiceRoleId } from '@/models/groupservicerole.model'

describe('GroupService model', () => {
  it('constructor assigns all properties correctly', () => {
    const service = new GroupService(
      toGroupServiceId('service123'),
      'displayName',
      'clientIdentifier',
      'description',
      [makeGroupServiceRole()],
    )

    expect(service.description).toBe('description')
    expect(service.displayName).toBe('displayName')
    expect(service.clientIdentifier).toBe('clientIdentifier')
    expect(service.id).toBe('service123')
  })

  it('fromApiData creates Service instance correctly', () => {
    const apiData: GroupServiceApiData = {
      id: toGroupServiceId('service456'),
      displayName: 'API Service',
      clientIdentifier: 'client-789',
      description: 'A service from API',
      sharedServiceRoles: [
        {
          allowedIdentityProviders: [],
          description: 'Standard user role',
          enabled: true,
          id: toGroupServiceRoleId('role456'),
          name: 'User',
        },
      ],
    }

    const service = GroupService.fromApiData(apiData)

    expect(service).toBeInstanceOf(GroupService)
    expect(service.id).toBe('service456')
    expect(service.displayName).toBe('API Service')
  })

  it('enabledRolesCount counts to 0 for empty', () => {
    const groupService = makeGroupService({
      roles: [],
    })

    expect(groupService.enabledRolesCount).toBe(0)
  })

  it('enabledRolesCount counts to 0', () => {
    const groupService = makeGroupService({
      roles: [
        makeGroupServiceRole({ id: 'id1', isEnabled: false }),
        makeGroupServiceRole({ id: 'id2', isEnabled: false }),
      ],
    })

    expect(groupService.enabledRolesCount).toBe(0)
  })

  it('enabledRolesCount counts to 1', () => {
    const groupService = makeGroupService({
      roles: [
        makeGroupServiceRole({ id: 'id1', isEnabled: false }),
        makeGroupServiceRole({ id: 'id2', isEnabled: true }),
      ],
    })

    expect(groupService.enabledRolesCount).toBe(1)
  })

  it('enabledRolesCount counts to 2', () => {
    const groupService = makeGroupService({
      roles: [
        makeGroupServiceRole({ id: 'id1', isEnabled: true }),
        makeGroupServiceRole({ id: 'id2', isEnabled: true }),
      ],
    })

    expect(groupService.enabledRolesCount).toBe(2)
  })

  it('hasEnabledRoles false for empty', () => {
    const groupService = makeGroupService({
      roles: [],
    })

    expect(groupService.hasEnabledRoles).toBe(false)
  })

  it('hasEnabledRoles false', () => {
    const groupService = makeGroupService({
      roles: [
        makeGroupServiceRole({ id: 'id1', isEnabled: false }),
        makeGroupServiceRole({ id: 'id2', isEnabled: false }),
      ],
    })

    expect(groupService.hasEnabledRoles).toBe(false)
  })

  it('hasEnabledRoles true', () => {
    const groupService = makeGroupService({
      roles: [
        makeGroupServiceRole({ id: 'id1', isEnabled: false }),
        makeGroupServiceRole({ id: 'id2', isEnabled: true }),
      ],
    })

    expect(groupService.hasEnabledRoles).toBe(true)
  })

  it('hasEnabledRoles true for multiples', () => {
    const groupService = makeGroupService({
      roles: [
        makeGroupServiceRole({ id: 'id1', isEnabled: true }),
        makeGroupServiceRole({ id: 'id2', isEnabled: true }),
      ],
    })

    expect(groupService.hasEnabledRoles).toBe(true)
  })
})
