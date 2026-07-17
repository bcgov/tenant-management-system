import { EntityManager } from 'typeorm'
import { TenantRepository } from '../../repositories/tenant.repository'
import { ConflictError } from '../../errors/ConflictError'
import { NotFoundError } from '../../errors/NotFoundError'
import { UnexpectedStateError } from '../../errors/UnexpectedStateError'
import { getManager } from '../../common/db.connection'
import { TMSConstants } from '../../common/tms.constants'

jest.mock('../../common/db.connection', () => ({
  getManager: jest.fn(),
}))

type MockQueryBuilder = {
  where: jest.Mock
  andWhere: jest.Mock
  innerJoin: jest.Mock
  leftJoin: jest.Mock
  leftJoinAndSelect: jest.Mock
  innerJoinAndSelect: jest.Mock
  orderBy: jest.Mock
  distinct: jest.Mock
  update: jest.Mock
  set: jest.Mock
  from: jest.Mock
  getOne: jest.Mock
  getMany: jest.Mock
  getExists: jest.Mock
  getCount: jest.Mock
  execute: jest.Mock
}

function createQueryBuilder(
  overrides: {
    getOne?: unknown
    getMany?: unknown[]
    getExists?: boolean
    getCount?: number
  } = {},
): MockQueryBuilder {
  const qb = {} as MockQueryBuilder
  const chained = [
    'where',
    'andWhere',
    'innerJoin',
    'leftJoin',
    'leftJoinAndSelect',
    'innerJoinAndSelect',
    'orderBy',
    'distinct',
    'update',
    'set',
    'from',
  ] as const
  chained.forEach((method) => {
    qb[method] = jest.fn().mockReturnValue(qb)
  })
  qb.getOne = jest.fn().mockResolvedValue(overrides.getOne ?? null)
  qb.getMany = jest.fn().mockResolvedValue(overrides.getMany ?? [])
  qb.getExists = jest.fn().mockResolvedValue(overrides.getExists ?? false)
  qb.getCount = jest.fn().mockResolvedValue(overrides.getCount ?? 0)
  qb.execute = jest.fn().mockResolvedValue(undefined)
  return qb
}

type MockManager = {
  createQueryBuilder: jest.Mock
  save: jest.Mock
  find: jest.Mock
  findOne: jest.Mock
  update: jest.Mock
}

function createManager(): MockManager {
  return {
    createQueryBuilder: jest.fn(),
    save: jest.fn(async (entity: unknown) => {
      if (Array.isArray(entity)) {
        entity.forEach((item) => {
          const record = item as { id?: string }
          record.id = record.id ?? 'generated-id'
        })
        return entity
      }
      const record = entity as { id?: string }
      record.id = record.id ?? 'generated-id'
      return entity
    }),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(undefined),
  }
}

describe('TenantRepository', () => {
  let repo: TenantRepository
  let manager: MockManager

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new TenantRepository()
    manager = createManager()
  })

  const asManager = (m: MockManager) => m as unknown as EntityManager

  describe('saveTenant', () => {
    const input = {
      name: 'Roads',
      ministryName: 'Ministry of Roads',
      description: 'desc',
      user: {
        ssoUserId: 'sso-1',
        firstName: 'John',
        lastName: 'Smith',
        displayName: 'John Smith',
        userName: 'jsmith',
        email: 'john@gov.bc.ca',
        idpType: 'idir' as const,
      },
    }

    it('creates a new tenant with default roles', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getExists: false })) // uniqueness check
        .mockReturnValueOnce(
          createQueryBuilder({
            getOne: { id: 'tenant-1', users: [{ id: 'tu-1' }] },
          }),
        ) // final fetch with relations
      manager.find.mockResolvedValueOnce([])

      const result = await repo.saveTenant(input, asManager(manager))

      expect(manager.save).toHaveBeenCalled()
      expect(result).toEqual({ id: 'tenant-1', users: [{ id: 'tu-1' }] })
    })

    it('reuses existing global roles when they already exist', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'tenant-1' } }))
      manager.find.mockResolvedValueOnce([
        { id: 'role-1', name: 'TENANT_OWNER' },
      ])

      await repo.saveTenant(input, asManager(manager))

      // tenant + tenantUserRoles only — no separate save for newly-created roles
      expect(manager.save).toHaveBeenCalledTimes(2)
      expect(manager.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: { id: 'role-1', name: 'TENANT_OWNER' },
          }),
        ]),
      )
    })

    it('throws ConflictError when a tenant with the same name/ministry exists', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: true }),
      )

      await expect(repo.saveTenant(input, asManager(manager))).rejects.toThrow(
        ConflictError,
      )
      expect(manager.save).not.toHaveBeenCalled()
    })

    it('throws UnexpectedStateError when the created tenant cannot be reloaded', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
      manager.find.mockResolvedValueOnce([])

      await expect(repo.saveTenant(input, asManager(manager))).rejects.toThrow(
        UnexpectedStateError,
      )
    })
  })

  describe('updateTenant', () => {
    const input = {
      tenantId: 'tenant-1',
      name: 'New Name',
      ministryName: undefined,
      description: undefined,
      updatedBy: 'admin-1',
    }

    it('updates the tenant', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { name: 'Old' } })) // currentTenant
        .mockReturnValueOnce(createQueryBuilder({ getOne: null })) // uniqueness check
        .mockReturnValueOnce(createQueryBuilder()) // update
        .mockReturnValueOnce(
          createQueryBuilder({
            getOne: { id: 'tenant-1', createdBy: 'system' },
          }),
        ) // reload

      const result = await repo.updateTenant(input, asManager(manager))

      expect(result).toEqual(
        expect.objectContaining({ id: 'tenant-1', createdBy: 'system' }),
      )
    })

    it('resolves createdBy to the creator username when not system', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { name: 'Old' } }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder())
        .mockReturnValueOnce(
          createQueryBuilder({
            getOne: { id: 'tenant-1', createdBy: 'sso-1' },
          }),
        )
      manager.findOne.mockResolvedValueOnce({ userName: 'jsmith' })

      const result = await repo.updateTenant(input, asManager(manager))

      expect(result.createdBy).toBe('jsmith')
    })

    it('throws ConflictError when the new name/ministry already exists on another tenant', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { name: 'Old' } }))
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { id: 'other-tenant' } }),
        )

      await expect(
        repo.updateTenant(input, asManager(manager)),
      ).rejects.toThrow(ConflictError)
    })

    it('throws UnexpectedStateError when the tenant cannot be reloaded after update', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { name: 'Old' } }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder())
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))

      await expect(
        repo.updateTenant(input, asManager(manager)),
      ).rejects.toThrow(UnexpectedStateError)
    })
  })

  describe('addTenantUsers', () => {
    const user = {
      ssoUserId: 'sso-1',
      firstName: 'John',
      lastName: 'Smith',
      displayName: 'John Smith',
      userName: 'jsmith',
      email: 'john@gov.bc.ca',
      idpType: 'idir' as const,
    }
    const input = {
      tenantId: 'tenant-1',
      updatedBy: 'admin-1',
      user,
      roles: ['role-1'],
    }

    it('creates a new tenant user when the tenant exists without this user', async () => {
      manager.createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'tenant-1' } })) // getTenantIfUserDoesNotExistForTenant
        .mockReturnValueOnce(createQueryBuilder({ getOne: null })) // assignUserRoles: getExistingRolesForUser
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] })) // softDeletedRoleAssignments
        .mockReturnValueOnce(
          createQueryBuilder({ getMany: [{ id: 'role-1' }] }),
        ) // validRoles
      manager.findOne = jest
        .fn()
        .mockResolvedValueOnce(null) // setSSOUser -> new user
        .mockResolvedValueOnce({ id: 'tu-1', ssoUser: { idpType: 'idir' } }) // assignUserRoles: tenantUser lookup

      const result = await repo.addTenantUsers(input, asManager(manager))

      expect(result.tenantUserId).toBeDefined()
      expect(result.roleAssignments.length).toBe(1)
    })

    it('restores a soft-deleted tenant user when the tenant does not have an active membership', async () => {
      manager.createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(createQueryBuilder({ getOne: null })) // getTenantIfUserDoesNotExistForTenant -> tenant is null
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'tu-1' } })) // findSoftDeletedTenantUser
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'tu-1' } })) // restoredTenantUserWithRelations
        .mockReturnValueOnce(createQueryBuilder({ getOne: null })) // assignUserRoles: getExistingRolesForUser
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] })) // softDeletedRoleAssignments
        .mockReturnValueOnce(
          createQueryBuilder({ getMany: [{ id: 'role-1' }] }),
        ) // validRoles
      manager.findOne = jest
        .fn()
        .mockResolvedValueOnce({ id: 'tu-1', ssoUser: { idpType: 'idir' } }) // assignUserRoles tenantUser lookup

      const result = await repo.addTenantUsers(input, asManager(manager))

      expect(result.tenantUserId).toBe('tu-1')
    })

    it('throws ConflictError when the user is already an active member', async () => {
      manager.createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null })) // findSoftDeletedTenantUser -> none
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'tu-1' } })) // getTenantUserBySsoId -> active user exists

      await expect(
        repo.addTenantUsers(input, asManager(manager)),
      ).rejects.toThrow(ConflictError)
    })

    it('throws NotFoundError when the user was previously offboarded and cannot be restored', async () => {
      manager.createQueryBuilder = jest
        .fn()
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))

      await expect(
        repo.addTenantUsers(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('createRoles', () => {
    const input = {
      tenantId: 'tenant-1',
      role: { name: 'CUSTOM_ROLE', description: 'A custom role' },
    }

    it('creates the role when the tenant exists and no conflict', async () => {
      manager.findOne.mockResolvedValueOnce({ id: 'tenant-1' })
      manager.find.mockResolvedValueOnce([])

      const result = await repo.createRoles(input, asManager(manager))

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'CUSTOM_ROLE' }),
      )
      expect(result).toEqual(expect.objectContaining({ name: 'CUSTOM_ROLE' }))
    })

    it('throws NotFoundError when the tenant does not exist', async () => {
      manager.findOne.mockResolvedValueOnce(null)

      await expect(repo.createRoles(input, asManager(manager))).rejects.toThrow(
        NotFoundError,
      )
    })

    it('throws ConflictError when the role already exists for the tenant', async () => {
      manager.findOne.mockResolvedValueOnce({ id: 'tenant-1' })
      manager.find.mockResolvedValueOnce([{ id: 'existing-role' }])

      await expect(repo.createRoles(input, asManager(manager))).rejects.toThrow(
        ConflictError,
      )
    })
  })

  describe('assignUserRoles', () => {
    it('throws NotFoundError when the tenant user does not exist', async () => {
      manager.findOne.mockResolvedValueOnce(null)

      await expect(
        repo.assignUserRoles(
          'tenant-1',
          'tu-1',
          ['role-1'],
          asManager(manager),
        ),
      ).rejects.toThrow(NotFoundError)
    })

    it('creates new assignments for roles not yet assigned', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 'tu-1',
        ssoUser: { idpType: 'idir' },
      })
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: null })) // getExistingRolesForUser
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] })) // softDeletedRoleAssignments
        .mockReturnValueOnce(
          createQueryBuilder({ getMany: [{ id: 'role-1' }] }),
        ) // validRoles

      const result = await repo.assignUserRoles(
        'tenant-1',
        'tu-1',
        ['role-1'],
        asManager(manager),
      )

      expect(result.length).toBe(1)
    })

    it('restores a soft-deleted role assignment', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 'tu-1',
        ssoUser: { idpType: 'idir' },
      })
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(
          createQueryBuilder({
            getMany: [{ id: 'tur-1', role: { id: 'role-1' }, isDeleted: true }],
          }),
        )

      const result = await repo.assignUserRoles(
        'tenant-1',
        'tu-1',
        ['role-1'],
        asManager(manager),
      )

      expect(result[0].isDeleted).toBe(false)
    })

    it('filters out non-service-user roles for bceid users', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 'tu-1',
        ssoUser: { idpType: 'bceidbusiness' },
      })
      manager.find.mockResolvedValueOnce([
        { id: 'role-1', name: 'SERVICE_USER' },
      ])
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] }))

      await expect(
        repo.assignUserRoles(
          'tenant-1',
          'tu-1',
          ['tenant-owner-role'],
          asManager(manager),
        ),
      ).rejects.toThrow(ConflictError)
    })

    it('throws ConflictError when all roles are already assigned', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 'tu-1',
        ssoUser: { idpType: 'idir' },
      })
      manager.createQueryBuilder
        .mockReturnValueOnce(
          createQueryBuilder({
            getOne: { roles: [{ role: { id: 'role-1' } }] },
          }),
        ) // getExistingRolesForUser -> existingRoleIds includes 'role-1'
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] })) // softDeletedRoleAssignments

      await expect(
        repo.assignUserRoles(
          'tenant-1',
          'tu-1',
          ['role-1'],
          asManager(manager),
        ),
      ).rejects.toThrow(ConflictError)
    })

    it('throws NotFoundError when some requested roles do not exist', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 'tu-1',
        ssoUser: { idpType: 'idir' },
      })
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] }))
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] }))

      await expect(
        repo.assignUserRoles(
          'tenant-1',
          'tu-1',
          ['role-1'],
          asManager(manager),
        ),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('assignUserRolesForUser', () => {
    it('delegates to assignUserRoles', async () => {
      manager.findOne.mockResolvedValueOnce({
        id: 'tu-1',
        ssoUser: { idpType: 'idir' },
      })
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] }))
        .mockReturnValueOnce(
          createQueryBuilder({ getMany: [{ id: 'role-1' }] }),
        )

      const result = await repo.assignUserRolesForUser(
        { tenantId: 'tenant-1', tenantUserId: 'tu-1', roleIds: ['role-1'] },
        asManager(manager),
      )

      expect(result.length).toBe(1)
    })
  })

  describe('getTenantRoles', () => {
    it('delegates to findTenantRoles', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getMany: [{ id: 'role-1' }] }),
      )

      const result = await repo.getTenantRoles(
        { tenantId: 'tenant-1' },
        asManager(manager),
      )

      expect(result).toEqual([{ id: 'role-1' }])
    })
  })

  describe('getUserRoles', () => {
    it('delegates to getRolesForUser', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getMany: [{ id: 'role-1' }] }),
      )

      const result = await repo.getUserRoles(
        { tenantId: 'tenant-1', tenantUserId: 'tu-1' },
        asManager(manager),
      )

      expect(result).toEqual([{ id: 'role-1' }])
    })
  })

  describe('unassignUserRoles', () => {
    const input = {
      tenantId: 'tenant-1',
      tenantUserId: 'tu-1',
      roleId: 'role-1',
      updatedBy: 'admin-1',
    }

    it('throws NotFoundError when the assignment does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.unassignUserRoles(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })

    it('unassigns a non-owner role successfully', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'tur-1' } })) // getTenantUserRole
        .mockReturnValueOnce(createQueryBuilder({ getCount: 2 })) // userRoleCount
      manager.findOne.mockResolvedValueOnce({ name: 'SERVICE_USER' }) // role lookup

      await repo.unassignUserRoles(input, asManager(manager))

      expect(manager.update).toHaveBeenCalled()
    })

    it('throws ConflictError when unassigning the last tenant owner', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'tur-1' } }))
        .mockReturnValueOnce(createQueryBuilder({ getCount: 0 })) // otherTenantOwnersCount
      manager.findOne.mockResolvedValueOnce({ name: TMSConstants.TENANT_OWNER })

      await expect(
        repo.unassignUserRoles(input, asManager(manager)),
      ).rejects.toThrow(ConflictError)
    })

    it('throws ConflictError when unassigning the last role from a user', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'tur-1' } }))
        .mockReturnValueOnce(createQueryBuilder({ getCount: 1 })) // userRoleCount
      manager.findOne.mockResolvedValueOnce({ name: 'SERVICE_USER' })

      await expect(
        repo.unassignUserRoles(input, asManager(manager)),
      ).rejects.toThrow(ConflictError)
    })
  })

  describe('checkUserTenantAccess', () => {
    it('checks access without required roles', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: true }),
      )

      const result = await repo.checkUserTenantAccess(
        'tenant-1',
        'sso-1',
        undefined,
        asManager(manager),
      )

      expect(result).toBe(true)
    })

    it('checks access with required roles', async () => {
      const qb = createQueryBuilder({ getExists: false })
      manager.createQueryBuilder.mockReturnValueOnce(qb)

      const result = await repo.checkUserTenantAccess(
        'tenant-1',
        'sso-1',
        ['TENANT_OWNER'],
        asManager(manager),
      )

      expect(qb.innerJoin).toHaveBeenCalled()
      expect(result).toBe(false)
    })

    it('falls back to getManager when no manager is passed', async () => {
      ;(getManager as jest.Mock).mockReturnValue(manager)
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: true }),
      )

      const result = await repo.checkUserTenantAccess('tenant-1', 'sso-1')

      expect(result).toBe(true)
    })
  })

  describe('getUserTenantAccessWithRoles', () => {
    it('returns no access when the tenant user is not found', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      const result = await repo.getUserTenantAccessWithRoles(
        'tenant-1',
        'sso-1',
        undefined,
        asManager(manager),
      )

      expect(result.hasAccess).toBe(false)
    })

    it('grants access when the user has one of the required roles', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({
          getOne: {
            roles: [{ role: { name: 'TENANT_OWNER' } }],
          },
        }),
      )

      const result = await repo.getUserTenantAccessWithRoles(
        'tenant-1',
        'sso-1',
        ['TENANT_OWNER'],
        asManager(manager),
      )

      expect(result.hasAccess).toBe(true)
    })

    it('denies access when the user lacks the required roles', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({
          getOne: { roles: [{ role: { name: 'SERVICE_USER' } }] },
        }),
      )

      const result = await repo.getUserTenantAccessWithRoles(
        'tenant-1',
        'sso-1',
        ['TENANT_OWNER'],
        asManager(manager),
      )

      expect(result.hasAccess).toBe(false)
    })
  })

  describe('getTenant', () => {
    it('throws NotFoundError when the tenant does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.getTenant(
          { tenantId: 'tenant-1', expand: [] },
          asManager(manager),
        ),
      ).rejects.toThrow(NotFoundError)
    })

    it('resolves createdBy display name for a real creator', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'tenant-1', createdBy: 'sso-1' } }),
      )
      manager.findOne.mockResolvedValueOnce({
        userName: 'jsmith',
        displayName: 'John Smith',
      })

      const result = (await repo.getTenant(
        { tenantId: 'tenant-1', expand: [] },
        asManager(manager),
      )) as unknown as {
        createdByUserName?: string
        createdByDisplayName?: string
      }

      expect(result.createdByUserName).toBe('jsmith')
      expect(result.createdByDisplayName).toBe('John Smith')
    })

    it('marks system as the creator without a lookup', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'tenant-1', createdBy: 'system' } }),
      )

      const result = (await repo.getTenant(
        { tenantId: 'tenant-1', expand: [] },
        asManager(manager),
      )) as unknown as { createdByUserName?: string }

      expect(manager.findOne).not.toHaveBeenCalled()
      expect(result.createdByUserName).toBe('system')
    })

    it('filters out deleted roles when expanding tenantUserRoles', async () => {
      const qb = createQueryBuilder({
        getOne: {
          id: 'tenant-1',
          users: [
            {
              roles: [
                { isDeleted: true, role: { name: 'X' } },
                { isDeleted: false, role: { name: 'Y' } },
              ],
            },
          ],
        },
      })
      manager.createQueryBuilder.mockReturnValueOnce(qb)

      const result = await repo.getTenant(
        { tenantId: 'tenant-1', expand: ['tenantUserRoles'] },
        asManager(manager),
      )

      expect(result.users?.[0].roles?.length).toBe(1)
    })
  })

  describe('getRolesForSSOUser', () => {
    it('throws NotFoundError when the tenant does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: false }),
      )

      await expect(
        repo.getRolesForSSOUser(
          { tenantId: 'tenant-1', ssoUserId: 'sso-1' },
          asManager(manager),
        ),
      ).rejects.toThrow(NotFoundError)
    })

    it('returns roles when the tenant exists', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getExists: true }))
        .mockReturnValueOnce(
          createQueryBuilder({ getMany: [{ id: 'role-1' }] }),
        )

      const result = await repo.getRolesForSSOUser(
        { tenantId: 'tenant-1', ssoUserId: 'sso-1' },
        asManager(manager),
      )

      expect(result).toEqual([{ id: 'role-1' }])
    })
  })

  describe('checkIfTenantUserExistsForTenant', () => {
    it('returns the existence check result', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: true }),
      )

      const result = await repo.checkIfTenantUserExistsForTenant(
        'tenant-1',
        'tu-1',
        asManager(manager),
      )

      expect(result).toBe(true)
    })
  })

  describe('getTenantUser', () => {
    it('throws NotFoundError when the tenant user does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.getTenantUser(
          { tenantId: 'tenant-1', tenantUserId: 'tu-1', expand: [] },
          asManager(manager),
        ),
      ).rejects.toThrow(NotFoundError)
    })

    it('maps roles when expand includes roles', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({
          getOne: {
            id: 'tu-1',
            ssoUser: {},
            roles: [{ role: { id: 'role-1', name: 'SERVICE_USER' } }],
          },
        }),
      )

      const result = await repo.getTenantUser(
        { tenantId: 'tenant-1', tenantUserId: 'tu-1', expand: ['roles'] },
        asManager(manager),
      )

      expect(result.roles).toEqual([{ id: 'role-1', name: 'SERVICE_USER' }])
    })
  })

  describe('checkIfTenantExists', () => {
    it('returns the existence check result', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: true }),
      )

      const result = await repo.checkIfTenantExists(
        'tenant-1',
        asManager(manager),
      )

      expect(result).toBe(true)
    })
  })

  describe('checkIfTenantNameAndMinistryNameExists', () => {
    it('returns the existence check result', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: true }),
      )

      const result = await repo.checkIfTenantNameAndMinistryNameExists(
        'Roads',
        'Ministry of Roads',
        asManager(manager),
      )

      expect(result).toBe(true)
    })
  })

  describe('getTenantsForUser', () => {
    it('returns tenants for the tms audience', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getMany: [{ id: 'tenant-1' }] }),
      )

      const result = await repo.getTenantsForUser(
        {
          ssoUserId: 'sso-1',
          expand: [],
          jwtAudience: 'tms-audience',
        },
        asManager(manager),
      )

      expect(result).toEqual([{ id: 'tenant-1' }])
    })

    it('adds a shared-service filter for a non-tms audience', async () => {
      const qb = createQueryBuilder({ getMany: [] })
      manager.createQueryBuilder.mockReturnValueOnce(qb)

      await repo.getTenantsForUser(
        {
          ssoUserId: 'sso-1',
          expand: ['tenantUserRoles'],
          jwtAudience: 'other-audience',
        },
        asManager(manager),
      )

      expect(qb.andWhere).toHaveBeenCalled()
      expect(qb.leftJoinAndSelect).toHaveBeenCalled()
    })
  })

  describe('getUsersForTenant', () => {
    it('returns tenant users without filters', async () => {
      const qb = createQueryBuilder({ getMany: [{ id: 'tu-1' }] })
      qb.innerJoinAndSelect = jest.fn().mockReturnValue(qb)
      manager.createQueryBuilder.mockReturnValueOnce(qb)

      const result = await repo.getUsersForTenant(
        { tenantId: 'tenant-1' },
        asManager(manager),
      )

      expect(result).toEqual([{ id: 'tu-1' }])
    })

    it('applies distinct when filtering by groupIds', async () => {
      const qb = createQueryBuilder({ getMany: [] })
      qb.innerJoinAndSelect = jest.fn().mockReturnValue(qb)
      manager.createQueryBuilder.mockReturnValueOnce(qb)

      await repo.getUsersForTenant(
        { tenantId: 'tenant-1', groupIds: ['group-1'] },
        asManager(manager),
      )

      expect(qb.distinct).toHaveBeenCalledWith(true)
    })

    it('joins groups when filtering by sharedServiceRoleIds without groupIds', async () => {
      const qb = createQueryBuilder({ getMany: [] })
      qb.innerJoinAndSelect = jest.fn().mockReturnValue(qb)
      manager.createQueryBuilder.mockReturnValueOnce(qb)

      await repo.getUsersForTenant(
        { tenantId: 'tenant-1', sharedServiceRoleIds: ['ssr-1'] },
        asManager(manager),
      )

      expect(qb.distinct).toHaveBeenCalledWith(true)
    })
  })

  describe('getTenantIfUserDoesNotExistForTenant', () => {
    it('returns the tenant when the subquery finds no existing membership', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'tenant-1' } }),
      )

      const result = await repo.getTenantIfUserDoesNotExistForTenant(
        'sso-1',
        'tenant-1',
        asManager(manager),
      )

      expect(result).toEqual({ id: 'tenant-1' })
    })
  })

  describe('findSoftDeletedTenantUser', () => {
    it('returns the soft-deleted tenant user when found', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'tu-1', isDeleted: true } }),
      )

      const result = await repo.findSoftDeletedTenantUser(
        'sso-1',
        'tenant-1',
        asManager(manager),
      )

      expect(result).toEqual({ id: 'tu-1', isDeleted: true })
    })
  })

  describe('findRoles', () => {
    it('finds roles by name only', async () => {
      manager.find.mockResolvedValueOnce([{ id: 'role-1' }])

      const result = await repo.findRoles(
        ['SERVICE_USER'],
        null,
        asManager(manager),
      )

      expect(result).toEqual([{ id: 'role-1' }])
    })

    it('scopes to a tenant when tenantId is provided', async () => {
      manager.find.mockResolvedValueOnce([])

      await repo.findRoles(['CUSTOM_ROLE'], 'tenant-1', asManager(manager))

      expect(manager.find).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          where: expect.objectContaining({ tenant: { id: 'tenant-1' } }),
        }),
      )
    })

    it('returns an empty array when find resolves falsy', async () => {
      manager.find.mockResolvedValueOnce(null)

      const result = await repo.findRoles(
        ['SERVICE_USER'],
        null,
        asManager(manager),
      )

      expect(result).toEqual([])
    })
  })

  describe('setSSOUser', () => {
    it('returns the existing SSO user when found', async () => {
      manager.findOne.mockResolvedValueOnce({ ssoUserId: 'sso-1' })

      const result = await repo.setSSOUser(
        'sso-1',
        'John',
        'Smith',
        'John Smith',
        'jsmith',
        'john@gov.bc.ca',
        'idir',
        asManager(manager),
      )

      expect(result).toEqual({ ssoUserId: 'sso-1' })
    })

    it('builds a new SSO user when not found', async () => {
      manager.findOne.mockResolvedValueOnce(null)

      const result = await repo.setSSOUser(
        'sso-1',
        'John',
        'Smith',
        'John Smith',
        'jsmith',
        'john@gov.bc.ca',
        'idir',
        asManager(manager),
      )

      expect(result.ssoUserId).toBe('sso-1')
      expect(result.createdBy).toBe('sso-1')
    })
  })

  describe('findTenantRoles', () => {
    it('returns all roles', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getMany: [{ id: 'role-1' }] }),
      )

      const result = await repo.findTenantRoles(asManager(manager))

      expect(result).toEqual([{ id: 'role-1' }])
    })
  })

  describe('getTenantUserBySsoId', () => {
    it('returns the tenant user when found', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'tu-1' } }),
      )

      const result = await repo.getTenantUserBySsoId(
        'sso-1',
        'tenant-1',
        asManager(manager),
      )

      expect(result).toEqual({ id: 'tu-1' })
    })
  })

  describe('assignDefaultRoleToUser', () => {
    it('assigns the SERVICE_USER role', async () => {
      manager.find.mockResolvedValueOnce([{ id: 'service-user-role' }])
      manager.findOne.mockResolvedValueOnce({
        id: 'tu-1',
        ssoUser: { idpType: 'idir' },
      })
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] }))
        .mockReturnValueOnce(
          createQueryBuilder({ getMany: [{ id: 'service-user-role' }] }),
        )

      await repo.assignDefaultRoleToUser('tu-1', 'tenant-1', asManager(manager))

      expect(manager.save).toHaveBeenCalled()
    })

    it('throws NotFoundError when the SERVICE_USER role does not exist', async () => {
      manager.find.mockResolvedValueOnce([])

      await expect(
        repo.assignDefaultRoleToUser('tu-1', 'tenant-1', asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('ensureTenantUserExists', () => {
    const user = {
      ssoUserId: 'sso-1',
      firstName: 'John',
      lastName: 'Smith',
      displayName: 'John Smith',
      userName: 'jsmith',
      email: 'john@gov.bc.ca',
      idpType: 'idir' as const,
    }

    it('creates a new tenant user when the tenant has no membership for this user', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'tenant-1' } }),
      ) // getTenantIfUserDoesNotExistForTenant
      manager.find.mockResolvedValueOnce([{ id: 'service-user-role' }])
      manager.findOne.mockResolvedValueOnce(null) // setSSOUser -> new
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: null })) // assignUserRoles softDeleted check via getExistingRolesForUser? handled below
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] }))
        .mockReturnValueOnce(
          createQueryBuilder({ getMany: [{ id: 'service-user-role' }] }),
        )
      manager.findOne.mockResolvedValueOnce({
        id: 'tu-1',
        ssoUser: { idpType: 'idir' },
      }) // assignUserRoles tenantUser lookup

      const result = await repo.ensureTenantUserExists(
        user,
        'tenant-1',
        'admin-1',
        asManager(manager),
      )

      expect(result).toBeDefined()
    })

    it('restores a soft-deleted membership and re-assigns the SERVICE_USER role', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: null })) // getTenantIfUserDoesNotExistForTenant -> null (membership exists or existed)
        .mockReturnValueOnce(createQueryBuilder({ getOne: null })) // getTenantUserBySsoId -> no active user
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { id: 'tu-1', isDeleted: true } }),
        ) // findSoftDeletedTenantUser
      manager.find.mockResolvedValueOnce([{ id: 'service-user-role' }])
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getMany: [] }))
        .mockReturnValueOnce(
          createQueryBuilder({ getMany: [{ id: 'service-user-role' }] }),
        )
      manager.findOne.mockResolvedValueOnce({
        id: 'tu-1',
        ssoUser: { idpType: 'idir' },
      })

      const result = await repo.ensureTenantUserExists(
        user,
        'tenant-1',
        'admin-1',
        asManager(manager),
      )

      expect(result).toBeDefined()
    })

    it('returns the existing active tenant user unchanged', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'tu-1' } })) // getTenantUserBySsoId -> found active

      const result = await repo.ensureTenantUserExists(
        user,
        'tenant-1',
        'admin-1',
        asManager(manager),
      )

      expect(result).toEqual({ id: 'tu-1' })
    })

    it('throws NotFoundError when the tenant exists standalone but the SERVICE_USER role is missing', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'tenant-1' } }),
      )
      manager.find.mockResolvedValueOnce([])

      await expect(
        repo.ensureTenantUserExists(
          user,
          'tenant-1',
          'admin-1',
          asManager(manager),
        ),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('checkIfTenantHasSharedServiceAccess', () => {
    it('returns the existence check result', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: true }),
      )

      const result = await repo.checkIfTenantHasSharedServiceAccess(
        'tenant-1',
        'client-1',
        asManager(manager),
      )

      expect(result).toBe(true)
    })
  })

  describe('removeTenantUser', () => {
    const input = {
      tenantId: 'tenant-1',
      tenantUserId: 'tu-1',
      deletedBy: 'admin-1',
    }

    it('throws NotFoundError when the tenant user does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.removeTenantUser(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })

    it('removes a non-owner tenant user successfully', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { id: 'tu-1', roles: [] } }),
        )
        .mockReturnValueOnce(createQueryBuilder()) // update TenantUserRole
        .mockReturnValueOnce(createQueryBuilder()) // update TenantUser

      await repo.removeTenantUser(input, asManager(manager))
    })

    it('throws ConflictError when removing the last tenant owner', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(
          createQueryBuilder({
            getOne: {
              id: 'tu-1',
              roles: [
                { role: { name: TMSConstants.TENANT_OWNER }, isDeleted: false },
              ],
            },
          }),
        )
        .mockReturnValueOnce(createQueryBuilder({ getCount: 0 }))

      await expect(
        repo.removeTenantUser(input, asManager(manager)),
      ).rejects.toThrow(ConflictError)
    })
  })

  describe('getTenantsUsersAndRoles', () => {
    it('returns the tenant with matching user and role', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'tenant-1' } }),
      )

      const result = await repo.getTenantsUsersAndRoles(
        'tenant-1',
        'tu-1',
        'role-1',
        asManager(manager),
      )

      expect(result).toEqual({ id: 'tenant-1' })
    })
  })
})
