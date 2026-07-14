import { Request } from 'express'
import { EntityManager } from 'typeorm'
import { TenantService } from '../../services/tenant.service'
import { tenantRepository } from '../../repositories/tenant.repository'
import { groupRepository } from '../../repositories/group.repository'
import { connection } from '../../common/db.connection'
import logger from '../../common/logger'

jest.mock('../../repositories/tenant.repository')
jest.mock('../../repositories/group.repository')
jest.mock('../../common/logger')
jest.mock('../../common/db.connection', () => ({
  connection: {
    manager: {
      transaction: jest.fn(),
    },
  },
}))

const FAKE_TX = { marker: 'fake-tx' } as unknown as EntityManager

const mockRepository = tenantRepository as jest.Mocked<typeof tenantRepository>
const mockGroupRepository = groupRepository as jest.Mocked<
  typeof groupRepository
>
const mockTransaction = connection.manager.transaction as jest.Mock
const mockLoggerError = logger.error as jest.Mock

function asRequest(overrides: Partial<Request>): Request {
  return overrides as Request
}

describe('TenantService', () => {
  let service: TenantService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new TenantService()
    mockTransaction.mockImplementation((callback: (tx: unknown) => unknown) =>
      callback(FAKE_TX),
    )
  })

  describe('createTenant', () => {
    const req = asRequest({
      body: {
        name: 'Roads',
        ministryName: 'Ministry of Roads',
        description: 'desc',
        user: { ssoUserId: 'sso-1' },
      },
    })

    it('threads the transaction manager and maps the result', async () => {
      mockRepository.saveTenant.mockResolvedValue({
        id: 'tenant-1',
        name: 'Roads',
        ministryName: 'Ministry of Roads',
        description: 'desc',
        createdBy: 'sso-1',
        updatedBy: 'sso-1',
        createdDateTime: new Date(),
        updatedDateTime: new Date(),
      } as never)

      const result = await service.createTenant(req)

      expect(mockTransaction).toHaveBeenCalledTimes(1)
      expect(mockRepository.saveTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Roads',
          ministryName: 'Ministry of Roads',
        }),
        FAKE_TX,
      )
      expect(result.data.tenant.id).toBe('tenant-1')
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockRepository.saveTenant.mockRejectedValue(error)

      await expect(service.createTenant(req)).rejects.toThrow(error)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Create tenant transaction failure - rolling back inserts ',
        { error: 'db down' },
      )
    })
  })

  describe('addTenantUser', () => {
    const req = asRequest({
      params: { tenantId: 'tenant-1' },
      body: {
        user: { ssoUserId: 'sso-1' },
        roles: ['role-1'],
        groups: ['group-1'],
      },
      decodedJwt: { idir_user_guid: 'admin-1' },
    })

    it('adds the tenant user, adds them to groups, and maps the response', async () => {
      mockRepository.addTenantUsers.mockResolvedValue({
        savedTenantUser: { id: 'tu-1' },
        roleAssignments: [],
        tenantUserId: 'tu-1',
      } as never)
      mockGroupRepository.addUserToGroups.mockResolvedValue([] as never)

      const result = await service.addTenantUser(req)

      expect(mockRepository.addTenantUsers).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', updatedBy: 'admin-1' }),
        FAKE_TX,
      )
      expect(mockGroupRepository.addUserToGroups).toHaveBeenCalledWith(
        'tu-1',
        ['group-1'],
        'tenant-1',
        'admin-1',
        FAKE_TX,
      )
      expect(result).toBeDefined()
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockRepository.addTenantUsers.mockRejectedValue(error)

      await expect(service.addTenantUser(req)).rejects.toThrow(error)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Add user to a tenant transaction failure - rolling back inserts ',
        { error: 'db down' },
      )
    })
  })

  describe('getTenantsForUser', () => {
    it('does not open a transaction for a plain read', async () => {
      mockRepository.getTenantsForUser.mockResolvedValue([] as never)

      await service.getTenantsForUser(
        asRequest({ params: { ssoUserId: 'sso-1' }, query: {} }),
      )

      expect(mockTransaction).not.toHaveBeenCalled()
      expect(mockRepository.getTenantsForUser).toHaveBeenCalledWith(
        expect.objectContaining({ ssoUserId: 'sso-1' }),
      )
    })
  })

  describe('getUsersForTenant', () => {
    it('parses groupIds and sharedServiceRoleIds from query params', async () => {
      mockRepository.getUsersForTenant.mockResolvedValue([] as never)

      await service.getUsersForTenant(
        asRequest({
          params: { tenantId: 'tenant-1' },
          query: { groupIds: 'g1, g2', sharedServiceRoleIds: 'r1' },
        }),
      )

      expect(mockRepository.getUsersForTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          groupIds: ['g1', 'g2'],
          sharedServiceRoleIds: ['r1'],
        }),
      )
    })
  })

  describe('createRoles', () => {
    it('threads the transaction manager', async () => {
      mockRepository.createRoles.mockResolvedValue({ id: 'role-1' } as never)

      const result = await service.createRoles(
        asRequest({ params: { tenantId: 'tenant-1' }, body: { role: {} } }),
      )

      expect(mockTransaction).toHaveBeenCalledTimes(1)
      expect(mockRepository.createRoles).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1' }),
        FAKE_TX,
      )
      expect(result.data.role).toEqual({ id: 'role-1' })
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockRepository.createRoles.mockRejectedValue(error)

      await expect(
        service.createRoles(
          asRequest({ params: { tenantId: 'tenant-1' }, body: { role: {} } }),
        ),
      ).rejects.toThrow(error)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Create Role for tenant transaction failure - rolling back inserts ',
        { error: 'db down' },
      )
    })
  })

  describe('assignUserRoles', () => {
    it('threads the transaction manager and maps roles from assignments', async () => {
      mockRepository.assignUserRolesForUser.mockResolvedValue([
        { role: { id: 'role-1', name: 'TENANT_OWNER' } },
      ] as never)

      const result = await service.assignUserRoles(
        asRequest({
          params: { tenantId: 'tenant-1', tenantUserId: 'tu-1' },
          body: { roles: ['role-1'] },
        }),
      )

      expect(mockTransaction).toHaveBeenCalledTimes(1)
      expect(mockRepository.assignUserRolesForUser).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', tenantUserId: 'tu-1' }),
        FAKE_TX,
      )
      expect(result.data.roles).toEqual([
        { id: 'role-1', name: 'TENANT_OWNER' },
      ])
    })

    it('throws when the transaction produces no data', async () => {
      mockTransaction.mockImplementation(async () => undefined)

      await expect(
        service.assignUserRoles(
          asRequest({
            params: { tenantId: 'tenant-1', tenantUserId: 'tu-1' },
            body: { roles: ['role-1'] },
          }),
        ),
      ).rejects.toThrow('Failed to assign user roles')
    })
  })

  describe('getTenantRoles', () => {
    it('does not open a transaction', async () => {
      mockRepository.getTenantRoles.mockResolvedValue([] as never)

      await service.getTenantRoles(
        asRequest({ params: { tenantId: 'tenant-1' } }),
      )

      expect(mockTransaction).not.toHaveBeenCalled()
    })
  })

  describe('getUserRoles', () => {
    it('does not open a transaction', async () => {
      mockRepository.getUserRoles.mockResolvedValue([] as never)

      await service.getUserRoles(
        asRequest({ params: { tenantId: 'tenant-1', tenantUserId: 'tu-1' } }),
      )

      expect(mockTransaction).not.toHaveBeenCalled()
    })
  })

  describe('unassignUserRoles', () => {
    it('threads the transaction manager', async () => {
      mockRepository.unassignUserRoles.mockResolvedValue(undefined)

      await service.unassignUserRoles(
        asRequest({
          params: {
            tenantId: 'tenant-1',
            tenantUserId: 'tu-1',
            roleId: 'role-1',
          },
          decodedJwt: { idir_user_guid: 'admin-1' },
        }),
      )

      expect(mockTransaction).toHaveBeenCalledTimes(1)
      expect(mockRepository.unassignUserRoles).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          tenantUserId: 'tu-1',
          roleId: 'role-1',
          updatedBy: 'admin-1',
        }),
        FAKE_TX,
      )
    })
  })

  describe('getTenant', () => {
    it('does not open a transaction', async () => {
      mockRepository.getTenant.mockResolvedValue({ id: 'tenant-1' } as never)

      const result = await service.getTenant(
        asRequest({ params: { tenantId: 'tenant-1' }, query: {} }),
      )

      expect(mockTransaction).not.toHaveBeenCalled()
      expect(result).toEqual({ data: { tenant: { id: 'tenant-1' } } })
    })
  })

  describe('updateTenant', () => {
    it('threads the transaction manager', async () => {
      mockRepository.updateTenant.mockResolvedValue({
        id: 'tenant-1',
        name: 'New Name',
      } as never)

      const result = await service.updateTenant(
        asRequest({
          params: { tenantId: 'tenant-1' },
          body: { name: 'New Name' },
          decodedJwt: { idir_user_guid: 'admin-1' },
        }),
      )

      expect(mockTransaction).toHaveBeenCalledTimes(1)
      expect(mockRepository.updateTenant).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', name: 'New Name' }),
        FAKE_TX,
      )
      expect(result.data.tenant).toEqual({ id: 'tenant-1', name: 'New Name' })
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockRepository.updateTenant.mockRejectedValue(error)

      await expect(
        service.updateTenant(
          asRequest({ params: { tenantId: 'tenant-1' }, body: {} }),
        ),
      ).rejects.toThrow(error)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Update tenant transaction failure - rolling back changes',
        { error: 'db down' },
      )
    })

    it('throws when the transaction produces no data', async () => {
      mockTransaction.mockImplementation(async () => undefined)

      await expect(
        service.updateTenant(
          asRequest({ params: { tenantId: 'tenant-1' }, body: {} }),
        ),
      ).rejects.toThrow('Failed to update tenant')
    })
  })

  describe('getRolesForSSOUser', () => {
    it('does not open a transaction', async () => {
      mockRepository.getRolesForSSOUser.mockResolvedValue([] as never)

      await service.getRolesForSSOUser(
        asRequest({ params: { tenantId: 'tenant-1', ssoUserId: 'sso-1' } }),
      )

      expect(mockTransaction).not.toHaveBeenCalled()
    })
  })

  describe('removeTenantUser', () => {
    const req = asRequest({
      params: { tenantId: 'tenant-1', tenantUserId: 'tu-1' },
      decodedJwt: { idir_user_guid: 'admin-1' },
    })

    it('removes the tenant user and removes them from all groups', async () => {
      mockRepository.removeTenantUser.mockResolvedValue(undefined)
      mockGroupRepository.removeUserFromAllGroups.mockResolvedValue(undefined)

      await service.removeTenantUser(req)

      expect(mockRepository.removeTenantUser).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', tenantUserId: 'tu-1' }),
        FAKE_TX,
      )
      expect(mockGroupRepository.removeUserFromAllGroups).toHaveBeenCalledWith(
        'tu-1',
        'admin-1',
        FAKE_TX,
      )
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockRepository.removeTenantUser.mockRejectedValue(error)

      await expect(service.removeTenantUser(req)).rejects.toThrow(error)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Remove tenant user transaction failure - rolling back changes',
        { error: 'db down' },
      )
    })
  })

  describe('getTenantUser', () => {
    it('does not expand groups or shared services by default', async () => {
      mockRepository.getTenantUser.mockResolvedValue({ id: 'tu-1' } as never)

      const result = await service.getTenantUser(
        asRequest({
          params: { tenantId: 'tenant-1', tenantUserId: 'tu-1' },
          query: {},
        }),
      )

      expect(mockGroupRepository.getTenantUserGroups).not.toHaveBeenCalled()
      expect(
        mockGroupRepository.getTenantUserSharedServiceRoles,
      ).not.toHaveBeenCalled()
      expect(result).toEqual({ data: { tenantUser: { id: 'tu-1' } } })
    })

    it('expands groups and shared services when requested', async () => {
      mockRepository.getTenantUser.mockResolvedValue({ id: 'tu-1' } as never)
      mockGroupRepository.getTenantUserGroups.mockResolvedValue([
        { id: 'group-1' },
      ] as never)
      mockGroupRepository.getTenantUserSharedServiceRoles.mockResolvedValue([
        { id: 'ssr-1' },
      ] as never)

      const result = await service.getTenantUser(
        asRequest({
          params: { tenantId: 'tenant-1', tenantUserId: 'tu-1' },
          query: { expand: 'groups,sharedServices' },
        }),
      )

      expect(mockGroupRepository.getTenantUserGroups).toHaveBeenCalledWith(
        'tu-1',
      )
      expect(
        mockGroupRepository.getTenantUserSharedServiceRoles,
      ).toHaveBeenCalledWith('tu-1')
      expect(result.data.tenantUser.groups).toEqual([{ id: 'group-1' }])
      expect(result.data.tenantUser.sharedServices).toEqual([{ id: 'ssr-1' }])
    })
  })
})
