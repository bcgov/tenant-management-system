import { Request } from 'express'
import { EntityManager } from 'typeorm'
import { GroupService } from '../../services/group.service'
import { groupRepository } from '../../repositories/group.repository'
import { tenantRepository } from '../../repositories/tenant.repository'
import { connection } from '../../common/db.connection'
import logger from '../../common/logger'

jest.mock('../../repositories/group.repository')
jest.mock('../../repositories/tenant.repository', () => ({
  tenantRepository: {
    ensureTenantUserExists: jest.fn(),
  },
}))
jest.mock('../../common/logger')
jest.mock('../../common/db.connection', () => ({
  connection: {
    manager: {
      transaction: jest.fn(),
    },
  },
}))

const FAKE_TX = { marker: 'fake-tx' } as unknown as EntityManager

const mockRepository = groupRepository as jest.Mocked<typeof groupRepository>
const mockTenantRepository = tenantRepository as jest.Mocked<
  typeof tenantRepository
>
const mockTransaction = connection.manager.transaction as jest.Mock
const mockLoggerError = logger.error as jest.Mock

function asRequest(overrides: Partial<Request>): Request {
  return overrides as Request
}

describe('GroupService', () => {
  let service: GroupService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new GroupService()
    mockTransaction.mockImplementation((callback: (tx: unknown) => unknown) =>
      callback(FAKE_TX),
    )
  })

  describe('createGroup', () => {
    const req = asRequest({
      params: { tenantId: 'tenant-1' },
      body: { name: 'Engineering', description: 'Eng group' },
      decodedJwt: { idir_user_guid: 'sso-1' },
    })

    it('maps the request and threads the transaction manager', async () => {
      mockRepository.saveGroup.mockResolvedValue({
        id: 'group-1',
        createdBy: 'sso-1',
      } as never)
      mockRepository.getSsoUserDisplayName.mockResolvedValue('Jane Doe')

      const result = await service.createGroup(req)

      expect(mockTransaction).toHaveBeenCalledTimes(1)
      expect(mockRepository.saveGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          name: 'Engineering',
          description: 'Eng group',
          createdBy: 'sso-1',
        }),
        FAKE_TX,
      )
      expect(result.data.group.createdByDisplayName).toBe('Jane Doe')
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockRepository.saveGroup.mockRejectedValue(error)

      await expect(service.createGroup(req)).rejects.toThrow(error)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Create group transaction failure - rolling back inserts ',
        { error: 'db down' },
      )
    })

    it('does not look up a display name when the group was created by the system', async () => {
      mockRepository.saveGroup.mockResolvedValue({
        id: 'group-1',
        createdBy: 'system',
      } as never)

      const result = await service.createGroup(req)

      expect(mockRepository.getSsoUserDisplayName).not.toHaveBeenCalled()
      expect(result.data.group.createdByDisplayName).toBe('system')
    })

    it('defaults the creator to system when no user is on the request', async () => {
      mockRepository.saveGroup.mockResolvedValue({
        id: 'group-1',
        createdBy: 'system',
      } as never)

      await service.createGroup(
        asRequest({
          params: { tenantId: 'tenant-1' },
          body: { name: 'Engineering', description: 'Eng group' },
        }),
      )

      expect(mockRepository.saveGroup).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'system' }),
        FAKE_TX,
      )
    })
  })

  describe('addGroupUser', () => {
    const req = asRequest({
      params: { tenantId: 'tenant-1', groupId: 'group-1' },
      body: { user: { ssoUserId: 'sso-1' } },
      decodedJwt: { idir_user_guid: 'admin-1' },
    })

    it('ensures the tenant user exists then adds them to the group', async () => {
      mockTenantRepository.ensureTenantUserExists.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockRepository.addGroupUser.mockResolvedValue({ id: 'gu-1' } as never)

      const result = await service.addGroupUser(req)

      expect(mockTenantRepository.ensureTenantUserExists).toHaveBeenCalledWith(
        { ssoUserId: 'sso-1' },
        'tenant-1',
        'admin-1',
        FAKE_TX,
      )
      expect(mockRepository.addGroupUser).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          groupId: 'group-1',
          tenantUserId: 'tu-1',
          updatedBy: 'admin-1',
        }),
        FAKE_TX,
      )
      expect(result).toEqual({ data: { groupUser: { id: 'gu-1' } } })
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockTenantRepository.ensureTenantUserExists.mockRejectedValue(error)

      await expect(service.addGroupUser(req)).rejects.toThrow(error)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Add user to group transaction failure - rolling back inserts ',
        { error: 'db down' },
      )
    })

    it("fails when the tenant user can't be created or found", async () => {
      mockTenantRepository.ensureTenantUserExists.mockResolvedValue(
        null as never,
      )

      await expect(service.addGroupUser(req)).rejects.toThrow(
        'Tenant user not found for tenant: tenant-1',
      )
    })

    it('errors if adding the user silently produces nothing', async () => {
      mockTenantRepository.ensureTenantUserExists.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockRepository.addGroupUser.mockResolvedValue(null as never)

      await expect(service.addGroupUser(req)).rejects.toThrow(
        'Group user creation failed',
      )
    })
  })

  describe('updateGroup', () => {
    const req = asRequest({
      params: { tenantId: 'tenant-1', groupId: 'group-1' },
      body: { name: 'New Name' },
      decodedJwt: { idir_user_guid: 'sso-1' },
    })

    it('maps the request and threads the transaction manager', async () => {
      mockRepository.updateGroup.mockResolvedValue({
        id: 'group-1',
        createdBy: 'system',
      } as never)

      const result = await service.updateGroup(req)

      expect(mockRepository.updateGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          groupId: 'group-1',
          name: 'New Name',
        }),
        FAKE_TX,
      )
      expect(result.data.group.createdByDisplayName).toBe('system')
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockRepository.updateGroup.mockRejectedValue(error)

      await expect(service.updateGroup(req)).rejects.toThrow(error)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Update group transaction failure - rolling back changes',
        { error: 'db down' },
      )
    })

    it('looks up a display name when the group has a real creator', async () => {
      mockRepository.updateGroup.mockResolvedValue({
        id: 'group-1',
        createdBy: 'sso-1',
      } as never)
      mockRepository.getSsoUserDisplayName.mockResolvedValue('Jane Doe')

      const result = await service.updateGroup(req)

      expect(mockRepository.getSsoUserDisplayName).toHaveBeenCalledWith('sso-1')
      expect(result.data.group.createdByDisplayName).toBe('Jane Doe')
    })
  })

  describe('removeGroupUser', () => {
    const req = asRequest({
      params: {
        tenantId: 'tenant-1',
        groupId: 'group-1',
        groupUserId: 'gu-1',
      },
      decodedJwt: { idir_user_guid: 'sso-1' },
    })

    it('removes the user and returns a success message', async () => {
      mockRepository.removeGroupUser.mockResolvedValue(undefined)

      const result = await service.removeGroupUser(req)

      expect(mockRepository.removeGroupUser).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          groupId: 'group-1',
          groupUserId: 'gu-1',
        }),
        FAKE_TX,
      )
      expect(result.data.message).toBe('User successfully removed from group')
    })

    it('logs and rethrows on transaction failure', async () => {
      const error = new Error('db down')
      mockRepository.removeGroupUser.mockRejectedValue(error)

      await expect(service.removeGroupUser(req)).rejects.toThrow(error)
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Remove user from group transaction failure - rolling back changes',
        { error: 'db down' },
      )
    })

    it('defaults updatedBy to system when the request has no JWT', async () => {
      mockRepository.removeGroupUser.mockResolvedValue(undefined)

      await service.removeGroupUser(
        asRequest({
          params: {
            tenantId: 'tenant-1',
            groupId: 'group-1',
            groupUserId: 'gu-1',
          },
        }),
      )

      expect(mockRepository.removeGroupUser).toHaveBeenCalledWith(
        expect.objectContaining({ updatedBy: 'system' }),
        FAKE_TX,
      )
    })
  })

  describe('getGroup', () => {
    it('does not open a transaction', async () => {
      mockRepository.getGroup.mockResolvedValue({ id: 'group-1' } as never)

      const result = await service.getGroup(
        asRequest({
          params: { tenantId: 'tenant-1', groupId: 'group-1' },
          query: {},
        }),
      )

      expect(mockTransaction).not.toHaveBeenCalled()
      expect(result).toEqual({ data: { group: { id: 'group-1' } } })
    })

    it('splits the expand query param into a list', async () => {
      mockRepository.getGroup.mockResolvedValue({ id: 'group-1' } as never)

      await service.getGroup(
        asRequest({
          params: { tenantId: 'tenant-1', groupId: 'group-1' },
          query: { expand: 'groupUsers' },
        }),
      )

      expect(mockRepository.getGroup).toHaveBeenCalledWith(
        expect.objectContaining({ expand: ['groupUsers'] }),
      )
    })
  })

  describe('getTenantGroups', () => {
    it('maps the request and does not open a transaction', async () => {
      mockRepository.getTenantGroups.mockResolvedValue([] as never)

      await service.getTenantGroups(
        asRequest({
          params: { tenantId: 'tenant-1' },
          decodedJwt: { idir_user_guid: 'sso-1' },
        }),
      )

      expect(mockRepository.getTenantGroups).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1' }),
      )
      expect(mockTransaction).not.toHaveBeenCalled()
    })
  })

  describe('getSharedServiceRolesForGroup', () => {
    it("returns a group's shared service roles", async () => {
      mockRepository.getSharedServiceRolesForGroup.mockResolvedValue([
        { id: 'ss-1' },
      ] as never)

      const result = await service.getSharedServiceRolesForGroup(
        asRequest({
          params: { tenantId: 'tenant-1', groupId: 'group-1' },
        }),
      )

      expect(mockRepository.getSharedServiceRolesForGroup).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', groupId: 'group-1' }),
      )
      expect(result).toEqual({ data: { sharedServices: [{ id: 'ss-1' }] } })
    })
  })

  describe('updateSharedServiceRolesForGroup', () => {
    it('threads the transaction manager', async () => {
      mockRepository.updateSharedServiceRolesForGroup.mockResolvedValue(
        [] as never,
      )

      await service.updateSharedServiceRolesForGroup(
        asRequest({
          params: { tenantId: 'tenant-1', groupId: 'group-1' },
          body: { sharedServices: [] },
          decodedJwt: { idir_user_guid: 'sso-1' },
        }),
      )

      expect(mockTransaction).toHaveBeenCalledTimes(1)
      expect(
        mockRepository.updateSharedServiceRolesForGroup,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ groupId: 'group-1' }),
        FAKE_TX,
      )
    })

    it('does not log on failure', async () => {
      mockRepository.updateSharedServiceRolesForGroup.mockRejectedValue(
        new Error('boom'),
      )

      await expect(
        service.updateSharedServiceRolesForGroup(
          asRequest({
            params: { tenantId: 'tenant-1', groupId: 'group-1' },
            body: { sharedServices: [] },
          }),
        ),
      ).rejects.toThrow('boom')
      expect(mockLoggerError).not.toHaveBeenCalled()
    })
  })

  describe('getUserGroupsWithSharedServiceRoles', () => {
    it('requires an audience and idp type', async () => {
      await expect(
        service.getUserGroupsWithSharedServiceRoles(
          asRequest({ params: { tenantId: 'tenant-1', ssoUserId: 'sso-1' } }),
        ),
      ).rejects.toThrow('Missing audience in JWT token')
    })

    it('rejects requests missing an identity provider type', async () => {
      await expect(
        service.getUserGroupsWithSharedServiceRoles(
          asRequest({
            params: { tenantId: 'tenant-1', ssoUserId: 'sso-1' },
            decodedJwt: { aud: 'client-a' },
          }),
        ),
      ).rejects.toThrow('Missing identity provider type in request')
    })

    it('returns the result when audience and idpType are present', async () => {
      mockRepository.getUserGroupsWithSharedServiceRoles.mockResolvedValue({
        groups: [],
      } as never)

      const result = await service.getUserGroupsWithSharedServiceRoles(
        asRequest({
          params: { tenantId: 'tenant-1', ssoUserId: 'sso-1' },
          decodedJwt: { aud: 'client-a' },
          idpType: 'idir',
        }),
      )

      expect(result).toEqual({ data: { groups: [] } })
    })
  })

  describe('getEffectiveSharedServiceRoles', () => {
    it('requires an audience and idp type', async () => {
      await expect(
        service.getEffectiveSharedServiceRoles(
          asRequest({ params: { tenantId: 'tenant-1', ssoUserId: 'sso-1' } }),
        ),
      ).rejects.toThrow('Missing audience in JWT token')
    })

    it('rejects requests missing an identity provider type', async () => {
      await expect(
        service.getEffectiveSharedServiceRoles(
          asRequest({
            params: { tenantId: 'tenant-1', ssoUserId: 'sso-1' },
            decodedJwt: { aud: 'client-a' },
          }),
        ),
      ).rejects.toThrow('Missing identity provider type in request')
    })

    it('returns the wrapped result', async () => {
      mockRepository.getEffectiveSharedServiceRoles.mockResolvedValue(
        [] as never,
      )

      const result = await service.getEffectiveSharedServiceRoles(
        asRequest({
          params: { tenantId: 'tenant-1', ssoUserId: 'sso-1' },
          decodedJwt: { aud: 'client-a' },
          idpType: 'idir',
        }),
      )

      expect(result).toEqual({ data: { sharedServiceRoles: [] } })
    })
  })
})
