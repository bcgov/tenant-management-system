import { assert, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { makeRole, makeTenant, makeUser } from '@/__tests__/__factories__'

import { type RoleApiData } from '@/mappers/role.mapper'
import { type SsoUserApiData } from '@/mappers/ssouser.mapper'
import { type TenantApiData } from '@/mappers/tenant.mapper'
import { type UserApiData } from '@/mappers/user.mapper'
import { toRoleId } from '@/models/role.model'
import { toSsoUserId } from '@/models/ssouser.model'
import {
  Tenant,
  type TenantDetailFields,
  toTenantId,
} from '@/models/tenant.model'
import { User, toUserId } from '@/models/user.model'
import { tenantService } from '@/services/tenant.service'
import { useRoleStore } from '@/stores/useRoleStore'
import { useTenantStore } from '@/stores/useTenantStore'

vi.mock('@/services/tenant.service', () => ({
  tenantService: {
    addUser: vi.fn(),
    getTenant: vi.fn(),
    getUser: vi.fn(),
    getUserTenants: vi.fn(),
    removeUser: vi.fn(),
    removeUserRole: vi.fn(),
    assignUserRoles: vi.fn(),
    updateTenant: vi.fn(),
  },
}))

describe('useTenantStore', () => {
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
    id: toRoleId('role-1'),
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
  })

  describe('addTenantUser', () => {
    it('appends a second user to the tenant without removing the first', async () => {
      const store = useTenantStore()
      const initialUser = makeUser({ id: toUserId('user-existing') })
      const tenant = makeTenant({
        id: toTenantId('tenant-1'),
        users: [initialUser],
      })
      store.tenants.push(tenant)
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
        tenant.id,
        makeUser({ id: toUserId('user-to-add') }),
      )

      expect(tenant.users).toHaveLength(2)
      expect(tenant.users[0].id).toBe(initialUser.id)
      expect(tenant.users[1].id).toBe(secondUserData.id)
      expect(tenant.users[1]).toBeInstanceOf(User)
    })

    it('errors if the tenant does not exist', async () => {
      const store = useTenantStore()
      const user = makeUser()

      await expect(
        store.addTenantUser(toTenantId('fake-id'), user),
      ).rejects.toThrow('Unknown tenantId: fake-id')
    })
  })

  describe('fetchTenant', () => {
    it('creates new tenant in state during upsert', async () => {
      const store = useTenantStore()
      vi.mocked(tenantService.getTenant).mockResolvedValue(mockTenantApiData)

      expect(store.tenants).toHaveLength(0)

      await store.fetchTenant(mockTenantApiData.id)

      expect(store.tenants).toHaveLength(1)
      expect(store.tenants[0].name).toBe('Test Tenant')
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

      await store.fetchTenants(toSsoUserId('u-1'))

      expect(store.tenants).toHaveLength(2)
      expect(store.tenants[0].name).toBe(mockTenantApiData.name)
      expect(store.tenants[1].name).toBe(secondTenant.name)
      expect(store.tenants[1]).toBeInstanceOf(Tenant)
    })
  })

  describe('fetchTenantUser', () => {
    it('errors if the tenant does not exist, without calling the API', async () => {
      const store = useTenantStore()

      await expect(
        store.fetchTenantUser(toTenantId('fake-id'), toUserId('user-123')),
      ).rejects.toThrow('Unknown tenantId: fake-id')

      expect(tenantService.getUser).not.toHaveBeenCalled()
    })

    it('calls the service with the tenant and user IDs', async () => {
      const store = useTenantStore()
      const tenant = makeTenant({ id: toTenantId('tenant-1'), users: [] })
      store.tenants = [tenant]
      vi.mocked(tenantService.getUser).mockResolvedValue(mockUserData)

      await store.fetchTenantUser(tenant.id, mockUserData.id)

      expect(tenantService.getUser).toHaveBeenCalledTimes(1)
      expect(tenantService.getUser).toHaveBeenCalledWith(
        tenant.id,
        mockUserData.id,
      )
    })

    it('returns the mapped user', async () => {
      const store = useTenantStore()
      const tenant = makeTenant({ id: toTenantId('tenant-1'), users: [] })
      store.tenants = [tenant]
      vi.mocked(tenantService.getUser).mockResolvedValue(mockUserData)

      const result = await store.fetchTenantUser(tenant.id, mockUserData.id)

      expect(result).toBeInstanceOf(User)
      expect(result.id).toBe(mockUserData.id)
    })

    describe('upsertTenantUser (helper)', () => {
      it('inserts the user when not already in the tenant, keeping existing users', async () => {
        const store = useTenantStore()
        const existingUser = makeUser({ id: toUserId('user-existing') })
        const tenant = makeTenant({
          id: toTenantId('tenant-1'),
          users: [existingUser],
        })
        store.tenants = [tenant]
        vi.mocked(tenantService.getUser).mockResolvedValue(mockUserData)

        await store.fetchTenantUser(tenant.id, mockUserData.id)

        const fetchedTenant = store.getTenant(tenant.id)
        assert(fetchedTenant, 'tenant should be in the store')
        const users = fetchedTenant.users
        expect(users).toHaveLength(2)
        expect(users[0].id).toBe(existingUser.id)
        expect(users[1].id).toBe(mockUserData.id)
        expect(users[1]).toBeInstanceOf(User)
      })

      it('replaces the user in place when already in the tenant', async () => {
        const store = useTenantStore()
        const otherUser = makeUser({ id: toUserId('user-other') })
        const staleUser = makeUser({ id: mockUserData.id, roles: [] })
        const tenant = makeTenant({
          id: toTenantId('tenant-1'),
          users: [otherUser, staleUser],
        })
        store.tenants = [tenant]
        vi.mocked(tenantService.getUser).mockResolvedValue(mockUserData)

        await store.fetchTenantUser(tenant.id, mockUserData.id)

        const fetchedTenant = store.getTenant(tenant.id)
        assert(fetchedTenant, 'tenant should be in the store')
        const users = fetchedTenant.users
        expect(users).toHaveLength(2)
        expect(users[0].id).toBe(otherUser.id)
        expect(users[1].id).toBe(mockUserData.id)
        expect(users[1]).not.toBe(staleUser)
        expect(users[1].roles).toHaveLength(1)
        expect(users[1].roles[0].id).toBe(toRoleId('role-1'))
      })

      it('keeps the tenant in the store without duplicating it', async () => {
        const store = useTenantStore()
        const tenant = makeTenant({ id: toTenantId('tenant-1'), users: [] })
        const otherTenant = makeTenant({ id: toTenantId('tenant-2') })
        store.tenants = [tenant, otherTenant]
        vi.mocked(tenantService.getUser).mockResolvedValue(mockUserData)

        await store.fetchTenantUser(tenant.id, mockUserData.id)

        expect(store.tenants).toHaveLength(2)
        expect(store.getTenant(tenant.id)).toBeDefined()
        expect(store.getTenant(otherTenant.id)).toBeDefined()
      })
    })

    it('propagates service errors and leaves tenant users unchanged', async () => {
      const store = useTenantStore()
      const existingUser = makeUser({ id: toUserId('user-existing') })
      const tenant = makeTenant({
        id: toTenantId('tenant-1'),
        users: [existingUser],
      })
      store.tenants = [tenant]
      vi.mocked(tenantService.getUser).mockRejectedValue(new Error('API down'))

      await expect(
        store.fetchTenantUser(tenant.id, mockUserData.id),
      ).rejects.toThrow('API down')

      const fetchedTenant = store.getTenant(tenant.id)
      assert(fetchedTenant, 'tenant should be in the store')
      const users = fetchedTenant.users
      expect(users).toHaveLength(1)
      expect(users[0].id).toBe(existingUser.id)
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
      const roleId = toRoleId('role-1')
      const user = makeUser({ id: toUserId('u-1') })
      user.roles = [makeRole({ id: roleId })]
      const tenant = makeTenant({ id: toTenantId('tenant-1') })
      tenant.users = [user]
      store.tenants.push(tenant)

      await store.removeTenantUserRole(tenant.id, user.id, roleId)

      expect(user.roles).toHaveLength(0)
      await expect(
        store.removeTenantUserRole(tenant.id, toUserId('fake'), roleId),
      ).rejects.toThrow('User with ID fake not found')
    })

    it('errors if the tenant does not exist', async () => {
      const store = useTenantStore()

      await expect(
        store.removeTenantUserRole(
          toTenantId('fake-id'),
          toUserId('user-id'),
          toRoleId('role-id'),
        ),
      ).rejects.toThrow('Unknown tenantId: fake-id')
    })
  })

  describe('assignTenantUserRoles', () => {
    it('syncs user roles with RoleStore state and covers role filtering', async () => {
      const store = useTenantStore()
      const roleStore = useRoleStore()

      const role1 = makeRole({ id: toRoleId('role-1') })
      const role2 = makeRole({ id: toRoleId('role-2') })
      roleStore.roles = [role1, role2]

      const user = makeUser({ id: toUserId('u-1'), roles: [] })
      const tenant = makeTenant()
      tenant.users = [user]

      // Filter logic: only include role1
      await store.assignTenantUserRoles(tenant, user.id, [role1.id])

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
