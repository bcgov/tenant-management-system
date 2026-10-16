import { Request } from 'express'
import { EntityManager } from 'typeorm'
import { GroupService } from '../../services/group.service'
import { groupRepository } from '../../repositories/group.repository'
import { tenantRepository } from '../../repositories/tenant.repository'
import { connection } from '../../common/db.connection'
import logger from '../../common/logger'
import { notificationService } from '../../services/notification.service'
import { config } from '../../services/config.service'
import { sharedServiceRepository } from '../../repositories/shared-service.repository'
import { ForbiddenError } from '../../errors/ForbiddenError'

jest.mock('../../repositories/group.repository')
jest.mock('../../repositories/tenant.repository', () => ({
  tenantRepository: {
    checkUserTenantAccess: jest.fn(),
    ensureTenantUserExists: jest.fn(),
    getTenantUserBySsoId: jest.fn(),
    getTenantUserWithRelations: jest.fn(),
  },
}))
jest.mock('../../repositories/shared-service.repository', () => ({
  sharedServiceRepository: {
    findSharedServicesByIds: jest.fn(),
  },
}))
jest.mock('../../services/notification.service', () => ({
  notificationService: {
    notifyUserAddedToTenant: jest.fn(),
    notifyUserAddedToGroup: jest.fn(),
    notifyUserRemovedFromGroup: jest.fn(),
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
const mockSharedServiceRepository = sharedServiceRepository as jest.Mocked<
  typeof sharedServiceRepository
>
const mockNotifyAdded = notificationService.notifyUserAddedToTenant as jest.Mock
const mockNotifyGroupAdded =
  notificationService.notifyUserAddedToGroup as jest.Mock
const mockNotifyGroupRemoved =
  notificationService.notifyUserRemovedFromGroup as jest.Mock
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

    describe('when a connected service adds someone', () => {
      const sam = {
        ssoUserId: 'SAM-GUID',
        displayName: 'Sam Lee',
        idpType: 'idir',
      }
      const notify = { id: 'ss-notify', name: 'notify', displayName: 'Notify' }
      const forms = { id: 'ss-forms', name: 'forms', displayName: 'Forms' }
      const headlessRequest = (confirmOtherServices?: string[]) =>
        asRequest({
          params: { tenantId: 'tenant-1', groupId: 'group-1' },
          body: { user: sam, confirmOtherServices },
          decodedJwt: { idir_user_guid: 'admin-1', aud: 'chefs-client' },
          isHeadlessAccess: true,
          headlessService: {
            id: 'ss-chefs',
            name: 'chefs',
            displayName: 'CHEFS',
            clientIdentifier: 'chefs-client',
          },
        })

      beforeEach(() => {
        mockTenantRepository.ensureTenantUserExists.mockResolvedValue({
          id: 'tu-1',
        } as never)
        mockRepository.addGroupUser.mockResolvedValue({ id: 'gu-1' } as never)
      })

      it('adds them when the group gives nothing new in other services', async () => {
        mockRepository.getNewRolesFromOtherServices.mockResolvedValueOnce([])

        await service.addGroupUser(headlessRequest())

        expect(
          mockRepository.getNewRolesFromOtherServices,
        ).toHaveBeenCalledWith({
          tenantId: 'tenant-1',
          groupId: 'group-1',
          callingServiceId: 'ss-chefs',
          ssoUserId: 'SAM-GUID',
          idpType: 'idir',
        })
        expect(mockRepository.addGroupUser).toHaveBeenCalled()
      })

      it('refuses and lists the other services when they are not confirmed', async () => {
        mockRepository.getNewRolesFromOtherServices.mockResolvedValueOnce([
          { id: 'r-1', name: 'Admin', sharedService: notify },
          { id: 'r-2', name: 'Sender', sharedService: notify },
          { id: 'r-3', name: 'Reviewer', sharedService: forms },
        ] as never)

        const attempt = service.addGroupUser(headlessRequest())

        await expect(attempt).rejects.toThrow(
          'Adding Sam Lee to this group would also give them access to Notify (Admin, Sender) and Forms (Reviewer). To go ahead, list these services in confirmOtherServices, or add them in the CSTAR web app.',
        )
        await expect(attempt).rejects.toBeInstanceOf(ForbiddenError)
        await expect(attempt).rejects.toMatchObject({
          code: 'OTHER_SERVICES_NOT_CONFIRMED',
          details: {
            otherServices: [
              {
                name: 'notify',
                displayName: 'Notify',
                roles: ['Admin', 'Sender'],
              },
              { name: 'forms', displayName: 'Forms', roles: ['Reviewer'] },
            ],
          },
        })
        expect(mockTransaction).not.toHaveBeenCalled()
        expect(mockRepository.addGroupUser).not.toHaveBeenCalled()
      })

      it('adds them once every other service is confirmed', async () => {
        mockRepository.getNewRolesFromOtherServices.mockResolvedValueOnce([
          { id: 'r-1', name: 'Admin', sharedService: notify },
          { id: 'r-3', name: 'Reviewer', sharedService: forms },
        ] as never)

        await service.addGroupUser(headlessRequest(['Notify ', 'forms']))

        expect(mockRepository.addGroupUser).toHaveBeenCalled()
      })

      it('refuses when only some of the other services are confirmed', async () => {
        mockRepository.getNewRolesFromOtherServices.mockResolvedValueOnce([
          { id: 'r-1', name: 'Admin', sharedService: notify },
          { id: 'r-3', name: 'Reviewer', sharedService: forms },
        ] as never)

        await expect(
          service.addGroupUser(headlessRequest(['notify'])),
        ).rejects.toMatchObject({ code: 'OTHER_SERVICES_NOT_CONFIRMED' })
        expect(mockRepository.addGroupUser).not.toHaveBeenCalled()
      })

      it('ignores extra services that were confirmed but not needed', async () => {
        mockRepository.getNewRolesFromOtherServices.mockResolvedValueOnce([
          { id: 'r-1', name: 'Admin', sharedService: notify },
        ] as never)

        await service.addGroupUser(headlessRequest(['notify', 'cdogs']))

        expect(mockRepository.addGroupUser).toHaveBeenCalled()
      })
    })

    it('does not run the check for the web app', async () => {
      mockTenantRepository.ensureTenantUserExists.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockRepository.addGroupUser.mockResolvedValue({ id: 'gu-1' } as never)

      await service.addGroupUser(req)

      expect(mockRepository.getNewRolesFromOtherServices).not.toHaveBeenCalled()
      expect(mockRepository.addGroupUser).toHaveBeenCalled()
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

    it('notifies a user who was newly added to the tenant', async () => {
      const tenantUserWithRelations = {
        id: 'tu-1',
        createdDateTime: '2026-08-05',
        ssoUser: { email: 'barrett.falk@gov.bc.ca' },
        tenant: { id: 'tenant-1', name: 'My Tenant' },
        roles: [{ role: { description: 'Service User' } }],
      }
      mockTenantRepository.getTenantUserBySsoId.mockResolvedValue(null as never)
      mockTenantRepository.ensureTenantUserExists.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockRepository.addGroupUser.mockResolvedValue({ id: 'gu-1' } as never)
      mockTenantRepository.getTenantUserWithRelations.mockResolvedValue(
        tenantUserWithRelations as never,
      )
      mockRepository.getGroupById.mockResolvedValue({
        id: 'group-1',
        name: 'Elections Support Team',
      } as never)

      await service.addGroupUser(req)

      expect(mockNotifyAdded).toHaveBeenCalledWith(
        tenantUserWithRelations,
        tenantUserWithRelations.roles,
        [{ id: 'group-1', name: 'Elections Support Team' }],
      )
    })

    it('does not notify a user who was already a member of the tenant', async () => {
      mockTenantRepository.getTenantUserBySsoId.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockTenantRepository.ensureTenantUserExists.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockRepository.addGroupUser.mockResolvedValue({ id: 'gu-1' } as never)

      await service.addGroupUser(req)

      expect(mockNotifyAdded).not.toHaveBeenCalled()
    })

    it('notifies an existing tenant member that they joined a group', async () => {
      const groupUser = {
        id: 'gu-1',
        createdDateTime: '2026-08-21',
        group: {
          id: 'group-1',
          name: 'Elections Support Team',
          tenant: { id: 'tenant-1', name: 'My Tenant' },
        },
        tenantUser: {
          ssoUser: { ssoUserId: 'SSO-1', email: 'test.user@example.com' },
        },
      }
      mockTenantRepository.getTenantUserBySsoId.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockTenantRepository.ensureTenantUserExists.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockRepository.addGroupUser.mockResolvedValue({ id: 'gu-1' } as never)
      mockRepository.getGroupUserWithRelations.mockResolvedValue(
        groupUser as never,
      )

      await service.addGroupUser(req)

      expect(mockNotifyGroupAdded).toHaveBeenCalledWith(
        groupUser,
        'System User',
      )
      expect(mockNotifyAdded).not.toHaveBeenCalled()
    })

    it('sends the tenant email, not the group email, for a brand new member', async () => {
      mockTenantRepository.getTenantUserBySsoId.mockResolvedValue(null as never)
      mockTenantRepository.ensureTenantUserExists.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockRepository.addGroupUser.mockResolvedValue({ id: 'gu-1' } as never)
      mockTenantRepository.getTenantUserWithRelations.mockResolvedValue({
        id: 'tu-1',
        roles: [],
      } as never)
      mockRepository.getGroupById.mockResolvedValue({
        id: 'group-1',
        name: 'Elections Support Team',
      } as never)

      await service.addGroupUser(req)

      expect(mockNotifyAdded).toHaveBeenCalled()
      expect(mockNotifyGroupAdded).not.toHaveBeenCalled()
    })

    it('does not notify a user who added themselves to a group', async () => {
      mockTenantRepository.getTenantUserBySsoId.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockTenantRepository.ensureTenantUserExists.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockRepository.addGroupUser.mockResolvedValue({ id: 'gu-1' } as never)
      mockRepository.getGroupUserWithRelations.mockResolvedValue({
        id: 'gu-1',
        group: { id: 'group-1', tenant: { id: 'tenant-1' } },
        tenantUser: {
          ssoUser: { ssoUserId: 'admin-1', email: 'test.user@example.com' },
        },
      } as never)

      await service.addGroupUser(
        asRequest({
          params: {
            tenantId: 'tenant-1',
            groupId: 'group-1',
          },
          body: { user: { ssoUserId: 'sso-1' } },
          decodedJwt: { idir_user_guid: 'ADMIN-1', display_name: 'Admin' },
        }),
      )

      expect(mockNotifyGroupAdded).not.toHaveBeenCalled()
    })

    it('still adds the user to the group when the group notification lookup fails', async () => {
      mockTenantRepository.getTenantUserBySsoId.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockTenantRepository.ensureTenantUserExists.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockRepository.addGroupUser.mockResolvedValue({ id: 'gu-1' } as never)
      mockRepository.getGroupUserWithRelations.mockRejectedValue(
        new Error('db blip'),
      )

      const result = await service.addGroupUser(req)

      expect(result).toEqual({ data: { groupUser: { id: 'gu-1' } } })
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Notification lookup failed',
        {
          groupUserId: 'gu-1',
          reason: 'db blip',
        },
      )
    })

    it('does not notify when adding the user to the group fails', async () => {
      mockTenantRepository.getTenantUserBySsoId.mockResolvedValue(null as never)
      mockTenantRepository.ensureTenantUserExists.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockRepository.addGroupUser.mockRejectedValue(new Error('db down'))

      await expect(service.addGroupUser(req)).rejects.toThrow('db down')

      expect(mockNotifyAdded).not.toHaveBeenCalled()
    })

    it('still adds the user to the group when the notification lookup fails', async () => {
      mockTenantRepository.getTenantUserBySsoId.mockResolvedValue(null as never)
      mockTenantRepository.ensureTenantUserExists.mockResolvedValue({
        id: 'tu-1',
      } as never)
      mockRepository.addGroupUser.mockResolvedValue({ id: 'gu-1' } as never)
      mockTenantRepository.getTenantUserWithRelations.mockRejectedValue(
        new Error('db blip'),
      )

      const result = await service.addGroupUser(req)

      expect(result).toEqual({ data: { groupUser: { id: 'gu-1' } } })
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Notification lookup failed',
        {
          tenantUserId: 'tu-1',
          reason: 'db blip',
        },
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

  describe('removeGroupUser', () => {
    const req = asRequest({
      params: {
        tenantId: 'tenant-1',
        groupId: 'group-1',
        groupUserId: 'gu-1',
      },
      decodedJwt: {
        idir_user_guid: 'ADMIN-1',
        display_name: 'Test Admin',
      },
    })

    const groupUser = {
      id: 'gu-1',
      updatedDateTime: '2026-08-21',
      group: {
        name: 'Elections Support Team',
        tenant: { id: 'tenant-1', name: 'My Tenant' },
      },
      tenantUser: {
        ssoUser: { ssoUserId: 'SSO-1', email: 'test.user@example.com' },
      },
    }

    it('notifies the removed user once the removal succeeds', async () => {
      mockRepository.removeGroupUser.mockResolvedValue(undefined as never)
      mockRepository.getGroupUserWithRelations.mockResolvedValue(
        groupUser as never,
      )

      await service.removeGroupUser(req)

      expect(mockNotifyGroupRemoved).toHaveBeenCalledWith(
        groupUser,
        'Test Admin',
      )
    })

    it('does not notify a user who removed their own group membership', async () => {
      mockRepository.removeGroupUser.mockResolvedValue(undefined as never)
      mockRepository.getGroupUserWithRelations.mockResolvedValue(
        groupUser as never,
      )

      await service.removeGroupUser(
        asRequest({
          params: {
            tenantId: 'tenant-1',
            groupId: 'group-1',
            groupUserId: 'gu-1',
          },
          decodedJwt: { idir_user_guid: 'sso-1', display_name: 'Test User' },
        }),
      )

      expect(mockNotifyGroupRemoved).not.toHaveBeenCalled()
    })

    it('does not notify when the group membership cannot be loaded', async () => {
      mockRepository.removeGroupUser.mockResolvedValue(undefined as never)
      mockRepository.getGroupUserWithRelations.mockResolvedValue(null as never)

      await service.removeGroupUser(req)

      expect(mockNotifyGroupRemoved).not.toHaveBeenCalled()
    })

    it('does not notify when the removal fails', async () => {
      mockRepository.removeGroupUser.mockRejectedValue(new Error('db down'))

      await expect(service.removeGroupUser(req)).rejects.toThrow('db down')

      expect(mockNotifyGroupRemoved).not.toHaveBeenCalled()
    })

    it('still removes the user when the notification lookup fails', async () => {
      mockRepository.removeGroupUser.mockResolvedValue(undefined as never)
      mockRepository.getGroupUserWithRelations.mockRejectedValue(
        new Error('db blip'),
      )

      const result = await service.removeGroupUser(req)

      expect(result).toEqual({
        data: { message: 'User successfully removed from group' },
      })
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Notification lookup failed',
        {
          groupUserId: 'gu-1',
          reason: 'db blip',
        },
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
    const chefs = { id: 'ss-1', clientIdentifier: 'chefs-client' }
    const notify = { id: 'ss-2', clientIdentifier: 'notify-client' }
    const params = { tenantId: 'tenant-1', groupId: 'group-1' }

    beforeEach(() => {
      mockRepository.getSharedServiceRolesForGroup.mockResolvedValue([
        chefs,
        notify,
      ] as never)
    })

    it('shows every service to the CSTAR web app', async () => {
      const result = await service.getSharedServiceRolesForGroup(
        asRequest({
          params,
          decodedJwt: { aud: config.oidc.tmsAudience, idir_user_guid: 'sso-1' },
        }),
      )

      expect(mockRepository.getSharedServiceRolesForGroup).toHaveBeenCalledWith(
        expect.objectContaining(params),
      )
      expect(result).toEqual({ data: { sharedServices: [chefs, notify] } })
      expect(mockTenantRepository.checkUserTenantAccess).not.toHaveBeenCalled()
    })

    it('shows every service to an owner or user admin calling through a service', async () => {
      mockTenantRepository.checkUserTenantAccess.mockResolvedValueOnce(true)

      const result = await service.getSharedServiceRolesForGroup(
        asRequest({
          params,
          decodedJwt: { aud: 'chefs-client', idir_user_guid: 'sso-1' },
        }),
      )

      expect(mockTenantRepository.checkUserTenantAccess).toHaveBeenCalledWith(
        'tenant-1',
        'sso-1',
        ['TMS.TENANT_OWNER', 'TMS.USER_ADMIN'],
      )
      expect(result).toEqual({ data: { sharedServices: [chefs, notify] } })
    })

    it('shows only the calling service to anyone else', async () => {
      mockTenantRepository.checkUserTenantAccess.mockResolvedValueOnce(false)

      const result = await service.getSharedServiceRolesForGroup(
        asRequest({
          params,
          decodedJwt: { aud: 'chefs-client', idir_user_guid: 'sso-1' },
        }),
      )

      expect(result).toEqual({ data: { sharedServices: [chefs] } })
    })

    it('checks a BCeID user the same way', async () => {
      mockTenantRepository.checkUserTenantAccess.mockResolvedValueOnce(false)

      const result = await service.getSharedServiceRolesForGroup(
        asRequest({
          params,
          decodedJwt: { aud: 'chefs-client', bceid_user_guid: 'bceid-1' },
        }),
      )

      expect(mockTenantRepository.checkUserTenantAccess).toHaveBeenCalledWith(
        'tenant-1',
        'bceid-1',
        ['TMS.TENANT_OWNER', 'TMS.USER_ADMIN'],
      )
      expect(result).toEqual({ data: { sharedServices: [chefs] } })
    })

    it('shows nothing when the group has none of the calling service roles', async () => {
      mockTenantRepository.checkUserTenantAccess.mockResolvedValueOnce(false)

      const result = await service.getSharedServiceRolesForGroup(
        asRequest({
          params,
          decodedJwt: { aud: 'forms-client', idir_user_guid: 'sso-1' },
        }),
      )

      expect(result).toEqual({ data: { sharedServices: [] } })
    })

    it('shows nothing when the token names no app and no user', async () => {
      const result = await service.getSharedServiceRolesForGroup(
        asRequest({ params, decodedJwt: {} }),
      )

      expect(result).toEqual({ data: { sharedServices: [] } })
      expect(mockTenantRepository.checkUserTenantAccess).not.toHaveBeenCalled()
    })
  })

  describe('updateSharedServiceRolesForGroup', () => {
    describe('when a connected service calls', () => {
      const chefs = {
        id: 'ss-chefs',
        name: 'chefs',
        displayName: 'CHEFS',
        clientIdentifier: 'chefs-client',
      }
      const headlessRequest = (sharedServices: unknown[]) =>
        asRequest({
          params: { tenantId: 'tenant-1', groupId: 'group-1' },
          body: { sharedServices },
          decodedJwt: { idir_user_guid: 'sso-1', aud: 'chefs-client' },
          isHeadlessAccess: true,
          headlessService: chefs,
        })
      const role = (id: string) => ({ id, enabled: true })

      it('saves changes to its own roles', async () => {
        mockRepository.updateSharedServiceRolesForGroup.mockResolvedValue(
          [] as never,
        )

        await service.updateSharedServiceRolesForGroup(
          headlessRequest([
            { id: 'ss-chefs', sharedServiceRoles: [role('r-1')] },
          ]),
        )

        expect(
          mockSharedServiceRepository.findSharedServicesByIds,
        ).not.toHaveBeenCalled()
        expect(mockTransaction).toHaveBeenCalledTimes(1)
      })

      it('refuses changes to another service and saves nothing', async () => {
        mockSharedServiceRepository.findSharedServicesByIds.mockResolvedValueOnce(
          [{ id: 'ss-notify', displayName: 'Notify' }] as never,
        )

        await expect(
          service.updateSharedServiceRolesForGroup(
            headlessRequest([
              { id: 'ss-chefs', sharedServiceRoles: [role('r-1')] },
              { id: 'ss-notify', sharedServiceRoles: [role('r-2')] },
            ]),
          ),
        ).rejects.toThrow(
          new ForbiddenError(
            'CHEFS can only change its own roles. Roles for Notify can only be changed in the CSTAR web app.',
          ),
        )
        expect(
          mockSharedServiceRepository.findSharedServicesByIds,
        ).toHaveBeenCalledWith(['ss-notify'])
        expect(mockTransaction).not.toHaveBeenCalled()
      })

      it('names every other service in a readable list', async () => {
        mockSharedServiceRepository.findSharedServicesByIds.mockResolvedValueOnce(
          [
            { id: 'ss-notify', displayName: 'Notify' },
            { id: 'ss-forms', displayName: 'Forms' },
            { id: 'ss-docs', displayName: 'CDOGS' },
          ] as never,
        )

        await expect(
          service.updateSharedServiceRolesForGroup(
            headlessRequest([
              { id: 'ss-notify', sharedServiceRoles: [role('r-2')] },
              { id: 'ss-forms', sharedServiceRoles: [role('r-3')] },
              { id: 'ss-docs', sharedServiceRoles: [role('r-4')] },
              { id: 'ss-notify', sharedServiceRoles: [role('r-5')] },
            ]),
          ),
        ).rejects.toThrow(
          'Roles for Notify, Forms and CDOGS can only be changed in the CSTAR web app.',
        )
        expect(
          mockSharedServiceRepository.findSharedServicesByIds,
        ).toHaveBeenCalledWith(['ss-notify', 'ss-forms', 'ss-docs'])
      })

      it('still refuses when the other service cannot be found', async () => {
        mockSharedServiceRepository.findSharedServicesByIds.mockResolvedValueOnce(
          [] as never,
        )

        await expect(
          service.updateSharedServiceRolesForGroup(
            headlessRequest([
              { id: 'ss-unknown', sharedServiceRoles: [role('r-9')] },
            ]),
          ),
        ).rejects.toThrow(
          'CHEFS can only change its own roles. Roles for other services can only be changed in the CSTAR web app.',
        )
        expect(mockTransaction).not.toHaveBeenCalled()
      })
    })

    it('lets the web app change several services at once', async () => {
      mockRepository.updateSharedServiceRolesForGroup.mockResolvedValue(
        [] as never,
      )

      await service.updateSharedServiceRolesForGroup(
        asRequest({
          params: { tenantId: 'tenant-1', groupId: 'group-1' },
          body: {
            sharedServices: [
              { id: 'ss-chefs', sharedServiceRoles: [] },
              { id: 'ss-notify', sharedServiceRoles: [] },
            ],
          },
          decodedJwt: { idir_user_guid: 'sso-1' },
        }),
      )

      expect(
        mockSharedServiceRepository.findSharedServicesByIds,
      ).not.toHaveBeenCalled()
      expect(mockTransaction).toHaveBeenCalledTimes(1)
    })

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
