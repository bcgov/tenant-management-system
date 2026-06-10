import { describe, expect, it } from 'vitest'

import { makeGroupServiceRoleApiData } from '@/__tests__/__factories__'

import {
  type GroupServiceApiData,
  groupServiceMapper,
} from '@/mappers/groupservice.mapper'
import { GroupService, toGroupServiceId } from '@/models/groupservice.model'

describe('GroupService mapper', () => {
  describe('fromApiData', () => {
    it('creates instance', () => {
      const apiData: GroupServiceApiData = {
        clientIdentifier: 'clientIdentifier',
        description: 'description',
        displayName: 'displayName',
        id: toGroupServiceId('id'),
        sharedServiceRoles: [makeGroupServiceRoleApiData()],
      }

      const service = groupServiceMapper.fromApiData(apiData)

      expect(service).toBeInstanceOf(GroupService)
      expect(service.clientIdentifier).toBe('clientIdentifier')
      expect(service.description).toBe('description')
      expect(service.displayName).toBe('displayName')
      expect(service.id).toBe('id')
      expect(service.roles).toHaveLength(1)
    })

    it('handles empty shared service roles', () => {
      const apiData: GroupServiceApiData = {
        clientIdentifier: 'clientIdentifier',
        description: 'description',
        displayName: 'displayName',
        id: toGroupServiceId('id'),
        sharedServiceRoles: [],
      }

      const service = groupServiceMapper.fromApiData(apiData)

      expect(service).toBeInstanceOf(GroupService)
      expect(service.roles).toHaveLength(0)
    })
  })
})
