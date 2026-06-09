import { describe, expect, it } from 'vitest'

import {
  makeGroupService,
  makeGroupServiceRole,
} from '@/__tests__/__factories__'

import { GroupService, toGroupServiceId } from '@/models/groupservice.model'

describe('GroupService model', () => {
  describe('constructor', () => {
    it('assigns properties', () => {
      const groupServiceRoles = [makeGroupServiceRole()]

      const service = new GroupService(
        toGroupServiceId('id'),
        'displayName',
        'clientIdentifier',
        'description',
        groupServiceRoles,
      )

      expect(service.clientIdentifier).toBe('clientIdentifier')
      expect(service.description).toBe('description')
      expect(service.displayName).toBe('displayName')
      expect(service.id).toBe('id')
      expect(service.roles).toBe(groupServiceRoles)
    })
  })

  describe('enabledRolesCount', () => {
    it('counts to 0 for empty', () => {
      const groupService = makeGroupService({
        roles: [],
      })

      expect(groupService.enabledRolesCount).toBe(0)
    })

    it('counts to 0', () => {
      const groupService = makeGroupService({
        roles: [
          makeGroupServiceRole({ id: 'id1', isEnabled: false }),
          makeGroupServiceRole({ id: 'id2', isEnabled: false }),
        ],
      })

      expect(groupService.enabledRolesCount).toBe(0)
    })

    it('counts to 1', () => {
      const groupService = makeGroupService({
        roles: [
          makeGroupServiceRole({ id: 'id1', isEnabled: false }),
          makeGroupServiceRole({ id: 'id2', isEnabled: true }),
        ],
      })

      expect(groupService.enabledRolesCount).toBe(1)
    })

    it('counts to 2', () => {
      const groupService = makeGroupService({
        roles: [
          makeGroupServiceRole({ id: 'id1', isEnabled: true }),
          makeGroupServiceRole({ id: 'id2', isEnabled: true }),
        ],
      })

      expect(groupService.enabledRolesCount).toBe(2)
    })
  })

  describe('hasEnabledRoles', () => {
    it('false for empty', () => {
      const groupService = makeGroupService({
        roles: [],
      })

      expect(groupService.hasEnabledRoles).toBe(false)
    })

    it('false', () => {
      const groupService = makeGroupService({
        roles: [
          makeGroupServiceRole({ id: 'id1', isEnabled: false }),
          makeGroupServiceRole({ id: 'id2', isEnabled: false }),
        ],
      })

      expect(groupService.hasEnabledRoles).toBe(false)
    })

    it('true', () => {
      const groupService = makeGroupService({
        roles: [
          makeGroupServiceRole({ id: 'id1', isEnabled: false }),
          makeGroupServiceRole({ id: 'id2', isEnabled: true }),
        ],
      })

      expect(groupService.hasEnabledRoles).toBe(true)
    })

    it('true for multiples', () => {
      const groupService = makeGroupService({
        roles: [
          makeGroupServiceRole({ id: 'id1', isEnabled: true }),
          makeGroupServiceRole({ id: 'id2', isEnabled: true }),
        ],
      })

      expect(groupService.hasEnabledRoles).toBe(true)
    })
  })
})
