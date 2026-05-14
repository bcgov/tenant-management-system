import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { makeRole, makeTenant, makeUser } from '@/__tests__/__factories__'

import { type RoleApiData, type RoleId } from '@/models/role.model'
import { type SsoUserApiData, toSsoUserId } from '@/models/ssouser.model'
import {
  Tenant,
  type TenantApiData,
  type TenantDetailFields,
  toTenantId,
} from '@/models/tenant.model'
import { User, type UserApiData, toUserId } from '@/models/user.model'
import { tenantService } from '@/services/tenant.service'
import { useRoleStore } from '@/stores/useRoleStore'
import { useTenantStore } from '@/stores/useTenantStore'

vi.mock('@/services/tenant.service', () => ({
  tenantService: {
    addUser: vi.fn(),
    getTenant: vi.fn(),
    getUserTenants: vi.fn(),
    removeUser: vi.fn(),
    removeUserRole: vi.fn(),
    assignUserRoles: vi.fn(),
    updateTenant: vi.fn(),
  },
}))

describe('Tenant Store', () => {
  const mockSsoData: SsoUserApiData = {
    displayName: 'John Doe',
    email: 'john@example.com',
    firstName: 'John',
    idpType: 'idir',
    lastName: 'Doe',
    ssoUserId: toSsoUserId('sso-123'),
    userName: 'jdoe',
  }

  const mockRoleData: RoleApiData = {
    description: 'Admin Role',
    id: 'role-1' as RoleId,
    name: 'ADMIN',
  }

  const mockUserData: UserApiData = {
    id: toUserId('user-123'),
    roles: [mockRoleData],
    ssoUser: mockSsoData,
  }

  const mockTenantApiData: TenantApiData = {
    createdBy: 'creator-guid',
    createdByDisplayName: 'Creator Name',
    createdDateTime: '2023-05-20',
    description: 'Tenant Description',
    id: toTenantId('tenant-123'),
    ministryName: 'Ministry of Testing',
    name: 'Test Tenant',
    users: [mockUserData],
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with default values', () => {
    const store = useTenantStore()
    expect(store.tenants).toEqual([])
    expect(store.loading).toBe(false)
  })

  describe('addTenantUser', () => {
    it('appends a second user to the tenant without removing the first', async () => {
      const store = useTenantStore()
      const initialUser = makeUser({ id: toUserId('user-existing') })
      const tenant = makeTenant({ users: [initialUser] })

      const secondUserData: UserApiData = {
        id: toUserId('user-second'),
        roles: [],
        ssoUser: {
          displayName: 'Second User',
          email: 'second@example.com',
          firstName: 'Second',
          idpType: 'azureidir',
          lastName: 'User',
          ssoUserId: toSsoUserId('sso-second'),
          userName: 'suser',
        },
      }

      vi.mocked(tenantService.addUser).mockResolvedValue(secondUserData)

      await store.addTenantUser(
        tenant,
        makeUser({ id: toUserId('user-to-add') }),
      )

      expect(tenant.users).toHaveLength(2)
      expect(tenant.users[0].id).toBe(initialUser.id)
      expect(tenant.users[1].id).toBe(secondUserData.id)
      expect(tenant.users[1]).toBeInstanceOf(User)
    })
  })

  describe('fetchTenant', () => {
    it('manages loading state and upserts fetched tenant', async () => {
      const store = useTenantStore()
      vi.mocked(tenantService.getTenant).mockResolvedValue(mockTenantApiData)

      const promise = store.fetchTenant(mockTenantApiData.id)
      expect(store.loading).toBe(true)

      const result = await promise
      expect(store.loading).toBe(false)
      expect(result.id).toBe(mockTenantApiData.id)
    })

    it('updates existing tenant in state during upsert', async () => {
      const store = useTenantStore()
      const existing = makeTenant({ id: mockTenantApiData.id, name: 'Old' })
      store.tenants = [existing]

      vi.mocked(tenantService.getTenant).mockResolvedValue(mockTenantApiData)

      await store.fetchTenant(mockTenantApiData.id)

      expect(store.tenants).toHaveLength(1)
      expect(store.tenants[0].name).toBe('Test Tenant')
    })
  })

  describe('fetchTenants', () => {
    it('sets the store list with mapped results', async () => {
      const store = useTenantStore()
      const secondTenant = {
        ...mockTenantApiData,
        id: toTenantId('tenant-456'),
        name: 'Second Tenant',
      }

      vi.mocked(tenantService.getUserTenants).mockResolvedValue([
        mockTenantApiData,
        secondTenant,
      ])

      await store.fetchTenants(toUserId('u-1'))

      expect(store.tenants).toHaveLength(2)
      expect(store.tenants[0].name).toBe(mockTenantApiData.name)
      expect(store.tenants[1].name).toBe(secondTenant.name)
      expect(store.tenants[1]).toBeInstanceOf(Tenant)
    })

    it('sets loading to false even if the fetch fails', async () => {
      const store = useTenantStore()
      vi.mocked(tenantService.getUserTenants).mockRejectedValue(
        new Error('Fail'),
      )

      await expect(store.fetchTenants(toUserId('u-1'))).rejects.toThrow('Fail')
      expect(store.loading).toBe(false)
    })
  })

  describe('removeTenantUser', () => {
    it('removes user from local tenant state', async () => {
      const store = useTenantStore()
      const tenant = makeTenant({ id: mockTenantApiData.id })
      const user = makeUser({ id: toUserId('u-1') })
      tenant.users = [user]
      store.tenants = [tenant]

      await store.removeTenantUser(mockTenantApiData.id, user.id)

      expect(tenant.users).toHaveLength(0)
    })

    it('gracefully exits if tenant is not found in store', async () => {
      const store = useTenantStore()
      await expect(
        store.removeTenantUser(toTenantId('fake'), toUserId('u-1')),
      ).resolves.not.toThrow()
    })
  })

  describe('removeTenantUserRole', () => {
    it('removes role from specific user and throws if missing', async () => {
      const store = useTenantStore()
      const roleId = 'role-1' as RoleId
      const user = makeUser({ id: toUserId('u-1') })
      user.roles = [makeRole({ id: roleId })]
      const tenant = makeTenant()
      tenant.users = [user]

      await store.removeTenantUserRole(tenant, user.id, roleId)

      expect(user.roles).toHaveLength(0)
      await expect(
        store.removeTenantUserRole(tenant, toUserId('fake'), roleId),
      ).rejects.toThrow('User with ID fake not found')
    })
  })

  describe('assignTenantUserRoles', () => {
    it('syncs user roles with RoleStore state and covers role filtering', async () => {
      const store = useTenantStore()
      const roleStore = useRoleStore()

      const role1 = makeRole({ id: 'role-1' })
      const role2 = makeRole({ id: 'role-2' })
      roleStore.roles = [role1, role2]

      const user = makeUser({ id: toUserId('u-1') })
      const tenant = makeTenant()
      tenant.users = [user]

      // Filter logic: only include role1
      await store.assignTenantUserRoles(tenant, user.id, [role1.id])

      expect(user.roles).toHaveLength(1)
      expect(user.roles[0].id).toBe(role1.id)
    })

    it('uses fullRoleIds for filtering when provided', async () => {
      const store = useTenantStore()
      const roleStore = useRoleStore()
      const role1 = makeRole({ id: 'role-1' })
      roleStore.roles = [role1]

      const user = makeUser({ id: toUserId('u-1') })
      const tenant = makeTenant()
      tenant.users = [user]

      // Pass role1 ID in the optional fullRoleIds parameter
      await store.assignTenantUserRoles(tenant, user.id, [], [role1.id])

      expect(user.roles).toHaveLength(1)
      expect(user.roles[0].id).toBe(role1.id)
    })

    it('throws when user is not found in tenant', async () => {
      const store = useTenantStore()
      const tenant = makeTenant({ users: [] })

      await expect(
        store.assignTenantUserRoles(tenant, toUserId('fake'), []),
      ).rejects.toThrow('User with ID fake not found')
    })
  })

  describe('updateTenantDetails', () => {
    it('updates local state properties on success', async () => {
      const store = useTenantStore()
      const tenant = makeTenant({ id: mockTenantApiData.id })
      store.tenants = [tenant]

      const details: TenantDetailFields = {
        name: 'New Name',
        ministryName: 'New Min',
        description: 'New Desc',
      }

      vi.mocked(tenantService.updateTenant).mockResolvedValue({
        ...mockTenantApiData,
        ...details,
      })

      await store.updateTenantDetails(mockTenantApiData.id, details)

      expect(tenant.name).toBe('New Name')
      expect(tenant.description).toBe('New Desc')
    })

    it('throws when tenant is missing from store', async () => {
      const store = useTenantStore()
      const details = { name: 'n', ministryName: 'm', description: 'd' }

      await expect(
        store.updateTenantDetails(toTenantId('fake'), details),
      ).rejects.toThrow('Tenant with ID fake not found')
    })
  })
})
