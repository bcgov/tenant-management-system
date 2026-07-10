import { EntityManager } from 'typeorm'
import { GroupRepository } from '../../repositories/group.repository'
import { tmsRepository } from '../../repositories/tms.repository'
import { ConflictError } from '../../errors/ConflictError'
import { NotFoundError } from '../../errors/NotFoundError'
import { getManager } from '../../common/db.connection'

jest.mock('../../common/db.connection', () => ({
  getManager: jest.fn(),
}))
jest.mock('../../repositories/tms.repository', () => ({
  tmsRepository: {
    getTenantUserBySsoId: jest.fn(),
  },
}))

const mockTmsRepository = tmsRepository as jest.Mocked<typeof tmsRepository>

type MockQueryBuilder = {
  where: jest.Mock
  andWhere: jest.Mock
  innerJoin: jest.Mock
  leftJoin: jest.Mock
  leftJoinAndSelect: jest.Mock
  addSelect: jest.Mock
  setParameter: jest.Mock
  orderBy: jest.Mock
  addOrderBy: jest.Mock
  distinct: jest.Mock
  update: jest.Mock
  set: jest.Mock
  getOne: jest.Mock
  getMany: jest.Mock
  getExists: jest.Mock
  getRawAndEntities: jest.Mock
  execute: jest.Mock
}

function createQueryBuilder(
  overrides: {
    getOne?: unknown
    getMany?: unknown[]
    getExists?: boolean
    getRawAndEntities?: { entities: unknown[]; raw: unknown[] }
  } = {},
): MockQueryBuilder {
  const qb = {} as MockQueryBuilder
  const chained = [
    'where',
    'andWhere',
    'innerJoin',
    'leftJoin',
    'leftJoinAndSelect',
    'addSelect',
    'setParameter',
    'orderBy',
    'addOrderBy',
    'distinct',
    'update',
    'set',
  ] as const
  chained.forEach((method) => {
    qb[method] = jest.fn().mockReturnValue(qb)
  })
  qb.getOne = jest.fn().mockResolvedValue(overrides.getOne ?? null)
  qb.getMany = jest.fn().mockResolvedValue(overrides.getMany ?? [])
  qb.getExists = jest.fn().mockResolvedValue(overrides.getExists ?? false)
  qb.getRawAndEntities = jest
    .fn()
    .mockResolvedValue(overrides.getRawAndEntities ?? { entities: [], raw: [] })
  qb.execute = jest.fn().mockResolvedValue(undefined)
  return qb
}

type MockManager = {
  createQueryBuilder: jest.Mock
  save: jest.Mock
  find: jest.Mock
  findOne: jest.Mock
}

function createManager(): MockManager {
  return {
    createQueryBuilder: jest.fn(),
    save: jest.fn(async (entity: unknown) => entity),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  }
}

describe('GroupRepository', () => {
  let repo: GroupRepository
  let manager: MockManager

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new GroupRepository()
    manager = createManager()
  })

  const asManager = (m: MockManager) => m as unknown as EntityManager

  describe('saveGroup', () => {
    const input = {
      tenantId: 'tenant-1',
      name: 'Engineering',
      description: 'Engineering group',
      createdBy: 'sso-1',
    }

    it('creates the group', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { id: 'group-1', users: [] } }),
        )

      const result = await repo.saveGroup(input, asManager(manager))

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Engineering', createdBy: 'sso-1' }),
      )
      expect(result).toEqual({ id: 'group-1', users: [] })
    })

    it('adds the tenant user to the group when tenantUserId is provided', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { id: 'group-1', users: [] } }),
        )
      manager.findOne.mockResolvedValueOnce({ id: 'tu-1', isDeleted: false })

      await repo.saveGroup(
        { ...input, tenantUserId: 'tu-1' },
        asManager(manager),
      )

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantUser: { id: 'tu-1' },
          isDeleted: false,
        }),
      )
    })

    it('throws ConflictError when the group name already exists in the tenant', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'existing' } }),
      )

      await expect(repo.saveGroup(input, asManager(manager))).rejects.toThrow(
        ConflictError,
      )
      expect(manager.save).not.toHaveBeenCalled()
    })

    it('throws NotFoundError when the tenant user does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )
      manager.findOne.mockResolvedValueOnce(null)

      await expect(
        repo.saveGroup(
          { ...input, tenantUserId: 'missing' },
          asManager(manager),
        ),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('addGroupUser', () => {
    const input = {
      tenantId: 'tenant-1',
      groupId: 'group-1',
      tenantUserId: 'tu-1',
      updatedBy: 'sso-1',
    }

    it('adds the user to the group', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'group-1' } }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(
          createQueryBuilder({
            getOne: {
              id: 'gu-1',
              isDeleted: false,
              createdDateTime: new Date(),
              updatedDateTime: new Date(),
              createdBy: 'sso-1',
              updatedBy: 'sso-1',
              tenantUser: {
                id: 'tu-1',
                isDeleted: false,
                ssoUser: {},
                createdDateTime: new Date(),
                updatedDateTime: new Date(),
                createdBy: 'sso-1',
                updatedBy: 'sso-1',
                roles: [],
              },
            },
          }),
        )

      const result = await repo.addGroupUser(input, asManager(manager))

      expect(result.id).toBe('gu-1')
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ isDeleted: false }),
      )
    })

    it('throws NotFoundError when the group does not exist in the tenant', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.addGroupUser(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })

    it('throws ConflictError when the user is already a member', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'group-1' } }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'gu-1' } }))

      await expect(
        repo.addGroupUser(input, asManager(manager)),
      ).rejects.toThrow(ConflictError)
    })
  })

  describe('updateGroup', () => {
    const input = {
      tenantId: 'tenant-1',
      groupId: 'group-1',
      name: 'New Name',
      updatedBy: 'sso-1',
    }

    it('updates the group', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'group-1' } }))
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({}))
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { id: 'group-1', name: 'New Name' } }),
        )

      const result = await repo.updateGroup(input, asManager(manager))

      expect(result).toEqual({ id: 'group-1', name: 'New Name' })
    })

    it('throws NotFoundError when the group does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(repo.updateGroup(input, asManager(manager))).rejects.toThrow(
        NotFoundError,
      )
    })

    it('throws ConflictError when the new name already exists', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'group-1' } }))
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { id: 'other-group' } }),
        )

      await expect(repo.updateGroup(input, asManager(manager))).rejects.toThrow(
        ConflictError,
      )
    })
  })

  describe('removeGroupUser', () => {
    const input = {
      tenantId: 'tenant-1',
      groupId: 'group-1',
      groupUserId: 'gu-1',
      updatedBy: 'sso-1',
    }

    it('removes the user from the group', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'group-1' } }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'gu-1' } }))
        .mockReturnValueOnce(createQueryBuilder({}))

      await repo.removeGroupUser(input, asManager(manager))

      expect(manager.createQueryBuilder).toHaveBeenCalledTimes(3)
    })

    it('throws NotFoundError when the group does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.removeGroupUser(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })

    it('throws NotFoundError when the group user does not exist', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'group-1' } }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))

      await expect(
        repo.removeGroupUser(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('getGroup', () => {
    it('returns the group', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'group-1' } }))
        .mockReturnValueOnce(
          createQueryBuilder({
            getOne: { id: 'group-1', createdBy: 'system' },
          }),
        )

      const result = await repo.getGroup(
        { tenantId: 'tenant-1', groupId: 'group-1', expand: [] },
        asManager(manager),
      )

      expect(result.id).toBe('group-1')
      expect(result.createdByDisplayName).toBe('system')
    })

    it('throws NotFoundError when the group does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.getGroup(
          { tenantId: 'tenant-1', groupId: 'missing', expand: [] },
          asManager(manager),
        ),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('getTenantGroups', () => {
    it('returns groups for the tenant using the passed manager', async () => {
      const qb = createQueryBuilder({
        getMany: [{ id: 'group-1', createdBy: 'system' }],
      })
      manager.createQueryBuilder.mockReturnValueOnce(qb)

      const result = await repo.getTenantGroups(
        {
          tenantId: 'tenant-1',
          jwtAudience: 'tms-audience',
          tmsAudience: 'tms-audience',
        },
        asManager(manager),
      )

      expect(result).toEqual([{ id: 'group-1', createdBy: 'system' }])
      expect(getManager).not.toHaveBeenCalled()
    })

    it('applies the shared-service audience filter when the JWT audience differs', async () => {
      const qb = createQueryBuilder({ getMany: [] })
      manager.createQueryBuilder.mockReturnValueOnce(qb)

      await repo.getTenantGroups(
        {
          tenantId: 'tenant-1',
          jwtAudience: 'shared-service-client',
          tmsAudience: 'tms-audience',
        },
        asManager(manager),
      )

      expect(qb.innerJoin).toHaveBeenCalled()
    })

    it('falls back to getManager when no manager is passed', async () => {
      const fallbackManager = createManager()
      fallbackManager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getMany: [] }),
      )
      ;(getManager as jest.Mock).mockReturnValueOnce(asManager(fallbackManager))

      await repo.getTenantGroups({
        tenantId: 'tenant-1',
        jwtAudience: 'tms-audience',
        tmsAudience: 'tms-audience',
      })

      expect(getManager).toHaveBeenCalledTimes(1)
    })
  })

  describe('getSharedServiceRolesForGroup', () => {
    it('returns shared service roles for the group', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getExists: true }))
        .mockReturnValueOnce(
          createQueryBuilder({ getRawAndEntities: { entities: [], raw: [] } }),
        )

      const result = await repo.getSharedServiceRolesForGroup(
        { tenantId: 'tenant-1', groupId: 'group-1' },
        asManager(manager),
      )

      expect(result).toEqual([])
    })

    it('throws NotFoundError when the group does not belong to the tenant', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: false }),
      )

      await expect(
        repo.getSharedServiceRolesForGroup(
          { tenantId: 'tenant-1', groupId: 'missing' },
          asManager(manager),
        ),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('updateSharedServiceRolesForGroup', () => {
    const input = {
      tenantId: 'tenant-1',
      groupId: 'group-1',
      updatedBy: 'sso-1',
      sharedServices: [
        {
          id: 'ss-1',
          sharedServiceRoles: [{ id: 'ssr-1', enabled: true }],
        },
      ],
    }

    it('throws NotFoundError when the group does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.updateSharedServiceRolesForGroup(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })

    it('throws NotFoundError when the shared service is not associated with the tenant', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'group-1' } }))
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] }))

      await expect(
        repo.updateSharedServiceRolesForGroup(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })

    it('creates a new role assignment when enabled and not yet assigned', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'group-1' } }))
        .mockReturnValueOnce(
          createQueryBuilder({
            getMany: [{ sharedService: { id: 'ss-1' } }],
          }),
        )
        .mockReturnValueOnce(
          createQueryBuilder({
            getMany: [{ id: 'ssr-1', sharedService: { id: 'ss-1' } }],
          }),
        )
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] }))
        .mockReturnValueOnce(
          createQueryBuilder({ getRawAndEntities: { entities: [], raw: [] } }),
        )

      await repo.updateSharedServiceRolesForGroup(input, asManager(manager))

      expect(manager.save).toHaveBeenCalled()
    })
  })

  describe('getUserGroupsWithSharedServiceRoles', () => {
    const input = {
      tenantId: 'tenant-1',
      ssoUserId: 'sso-1',
      audience: 'client-a',
      idpType: 'idir',
    }

    it('returns the groups for the user', async () => {
      mockTmsRepository.getTenantUserBySsoId.mockResolvedValue({
        id: 'tu-1',
      } as never)
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getMany: [] }),
      )

      const result = await repo.getUserGroupsWithSharedServiceRoles(
        input,
        asManager(manager),
      )

      expect(result).toEqual({ groups: [] })
    })

    it('throws NotFoundError when the tenant user does not exist', async () => {
      mockTmsRepository.getTenantUserBySsoId.mockResolvedValue(null)

      await expect(
        repo.getUserGroupsWithSharedServiceRoles(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('getEffectiveSharedServiceRoles', () => {
    const input = {
      tenantId: 'tenant-1',
      ssoUserId: 'sso-1',
      audience: 'client-a',
      idpType: 'idir',
    }

    it('returns the effective roles for the user', async () => {
      mockTmsRepository.getTenantUserBySsoId.mockResolvedValue({
        id: 'tu-1',
      } as never)
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getMany: [] }),
      )

      const result = await repo.getEffectiveSharedServiceRoles(
        input,
        asManager(manager),
      )

      expect(result).toEqual([])
    })

    it('throws NotFoundError when the tenant user does not exist', async () => {
      mockTmsRepository.getTenantUserBySsoId.mockResolvedValue(null)

      await expect(
        repo.getEffectiveSharedServiceRoles(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('addUserToGroups', () => {
    it('returns an empty array when no groupIds are given', async () => {
      const result = await repo.addUserToGroups(
        'tu-1',
        [],
        'tenant-1',
        'sso-1',
        asManager(manager),
      )

      expect(result).toEqual([])
      expect(manager.createQueryBuilder).not.toHaveBeenCalled()
    })

    it('creates new group memberships for valid groups', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(
          createQueryBuilder({ getMany: [{ id: 'group-1' }] }),
        )
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] }))
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] }))

      const result = await repo.addUserToGroups(
        'tu-1',
        ['group-1'],
        'tenant-1',
        'sso-1',
        asManager(manager),
      )

      expect(result).toEqual([{ id: 'group-1' }])
      expect(manager.save).toHaveBeenCalled()
    })
  })

  describe('removeUserFromAllGroups', () => {
    it('soft-deletes all group memberships for the tenant user', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(createQueryBuilder({}))

      await repo.removeUserFromAllGroups('tu-1', 'sso-1', asManager(manager))

      expect(manager.createQueryBuilder).toHaveBeenCalledTimes(1)
    })
  })

  describe('getSsoUserDisplayName', () => {
    it('uses the passed manager', async () => {
      manager.findOne.mockResolvedValueOnce({ displayName: 'Jane Doe' })

      const result = await repo.getSsoUserDisplayName(
        'sso-1',
        asManager(manager),
      )

      expect(result).toBe('Jane Doe')
      expect(getManager).not.toHaveBeenCalled()
    })

    it('falls back to getManager when no manager is passed', async () => {
      const fallbackManager = createManager()
      fallbackManager.findOne.mockResolvedValueOnce(null)
      ;(getManager as jest.Mock).mockReturnValueOnce(asManager(fallbackManager))

      await repo.getSsoUserDisplayName('sso-1')

      expect(getManager).toHaveBeenCalledTimes(1)
    })
  })
})
