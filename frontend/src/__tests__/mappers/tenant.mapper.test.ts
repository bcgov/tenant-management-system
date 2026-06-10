import { describe, expect, it } from 'vitest'

import { makeUserApiData } from '@/__tests__/__factories__'

import { type TenantApiData, tenantMapper } from '@/mappers/tenant.mapper'
import { userMapper } from '@/mappers/user.mapper'
import { Tenant, toTenantId } from '@/models/tenant.model'

describe('Tenant mapper', () => {
  describe('fromApiData', () => {
    it('creates instance', () => {
      const userApiData = makeUserApiData()
      const user = userMapper.fromApiData(userApiData)
      const apiData: TenantApiData = {
        createdBy: 'createdBy',
        createdDateTime: 'createdDateTime',
        description: 'description',
        id: toTenantId('id'),
        ministryName: 'ministryName',
        name: 'name',
        users: [userApiData],
      }

      const tenant = tenantMapper.fromApiData(apiData)

      expect(tenant).toBeInstanceOf(Tenant)
      expect(tenant.createdBy).toBe('createdBy')
      expect(tenant.createdDate).toBe('createdDateTime')
      expect(tenant.description).toBe('description')
      expect(tenant.id).toBe('id')
      expect(tenant.ministryName).toBe('ministryName')
      expect(tenant.name).toBe('name')
      expect(tenant.users.length).toBe(1)
      expect(tenant.users[0]).toEqual(user)
    })

    it('handles created by display name', () => {
      const apiData = {
        createdBy: 'createdBy',
        createdByDisplayName: 'createdByDisplayName',
        createdDateTime: 'createdDateTime',
        description: 'description',
        id: toTenantId('id'),
        ministryName: 'ministryName',
        name: 'name',
        users: [makeUserApiData()],
      }

      const tenant = tenantMapper.fromApiData(apiData)

      expect(tenant).toBeInstanceOf(Tenant)
      expect(tenant.createdBy).toBe('createdByDisplayName')
    })

    it('handles empty users', () => {
      const apiData: TenantApiData = {
        createdBy: 'createdBy',
        createdDateTime: 'createdDateTime',
        description: 'description',
        id: toTenantId('id'),
        ministryName: 'ministryName',
        name: 'name',
        users: [],
      }

      const tenant = tenantMapper.fromApiData(apiData)

      expect(tenant).toBeInstanceOf(Tenant)
      expect(tenant.users.length).toBe(0)
    })
  })
})
