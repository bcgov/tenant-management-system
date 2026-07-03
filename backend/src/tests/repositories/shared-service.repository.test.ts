import { EntityManager } from 'typeorm'
import { SharedServiceRepository } from '../../repositories/shared-service.repository'
import { ConflictError } from '../../errors/ConflictError'
import { NotFoundError } from '../../errors/NotFoundError'
import { getManager } from '../../common/db.connection'

jest.mock('../../common/db.connection', () => ({
  getManager: jest.fn(),
}))

type MockQueryBuilder = {
  where: jest.Mock
  andWhere: jest.Mock
  from: jest.Mock
  leftJoinAndSelect: jest.Mock
  innerJoinAndSelect: jest.Mock
  innerJoin: jest.Mock
  orderBy: jest.Mock
  getOne: jest.Mock
  getMany: jest.Mock
  getExists: jest.Mock
}

function createQueryBuilder(
  overrides: {
    getOne?: unknown
    getMany?: unknown[]
    getExists?: boolean
  } = {},
): MockQueryBuilder {
  const qb = {} as MockQueryBuilder
  const chained = [
    'where',
    'andWhere',
    'from',
    'leftJoinAndSelect',
    'innerJoinAndSelect',
    'innerJoin',
    'orderBy',
  ] as const
  chained.forEach((method) => {
    qb[method] = jest.fn().mockReturnValue(qb)
  })
  qb.getOne = jest.fn().mockResolvedValue(overrides.getOne ?? null)
  qb.getMany = jest.fn().mockResolvedValue(overrides.getMany ?? [])
  qb.getExists = jest.fn().mockResolvedValue(overrides.getExists ?? false)
  return qb
}

type MockManager = {
  createQueryBuilder: jest.Mock
  save: jest.Mock
}

function createManager(): MockManager {
  return {
    createQueryBuilder: jest.fn(),
    save: jest.fn(async (entity: unknown) => {
      if (Array.isArray(entity)) {
        entity.forEach((item, index) => {
          const record = item as { id?: string }
          record.id = record.id ?? `generated-role-id-${index}`
        })
        return entity
      }
      const record = entity as { id?: string }
      record.id = record.id ?? 'generated-id'
      return entity
    }),
  }
}

describe('SharedServiceRepository', () => {
  let repo: SharedServiceRepository
  let manager: MockManager

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new SharedServiceRepository()
    manager = createManager()
  })

  const asManager = (m: MockManager) => m as unknown as EntityManager

  const validCreateInput = {
    name: 'Test Shared Service',
    displayName: 'Test Shared Service Display',
    clientIdentifier: 'test-service-client',
    landingPageUrl: 'https://example.gov.bc.ca/test-shared-service',
    description: 'Test Description',
    isActive: true,
    roles: [
      { name: 'Admin Role', description: 'Administrator role' },
      { name: 'User Role', description: 'Standard user role' },
    ],
    updatedBy: 'F45AFBBD68C51D6F956BA3A1DE1878A1',
  }

  describe('saveSharedService', () => {
    it('creates the shared service and its roles', async () => {
      const aggregate = { id: 'generated-id', name: validCreateInput.name }
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: aggregate }))

      const result = await repo.saveSharedService(
        validCreateInput,
        asManager(manager),
      )

      expect(result).toBe(aggregate)
      expect(manager.save).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          name: validCreateInput.name,
          displayName: validCreateInput.displayName,
          clientIdentifier: validCreateInput.clientIdentifier,
          landingPageUrl: validCreateInput.landingPageUrl,
          description: validCreateInput.description,
          isActive: true,
          createdBy: validCreateInput.updatedBy,
          updatedBy: validCreateInput.updatedBy,
        }),
      )
      expect(manager.save).toHaveBeenNthCalledWith(2, [
        expect.objectContaining({
          name: 'Admin Role',
          description: 'Administrator role',
          allowedIdentityProviders: null,
          isDeleted: false,
        }),
        expect.objectContaining({
          name: 'User Role',
          description: 'Standard user role',
          allowedIdentityProviders: null,
        }),
      ])
    })

    it('applies defaults for minimal input', async () => {
      const minimalInput = {
        name: 'Minimal Service',
        displayName: 'Minimal Service Display',
        clientIdentifier: 'minimal-service',
        landingPageUrl: 'https://example.gov.bc.ca/minimal-service',
        roles: [{ name: 'Basic Role' }],
        updatedBy: 'system',
      }
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'x' } }))

      await repo.saveSharedService(minimalInput, asManager(manager))

      const savedSharedService = manager.save.mock.calls[0][0] as {
        isActive: boolean
        description?: string
      }
      expect(savedSharedService.isActive).toBe(true)
      expect(savedSharedService.description).toBeUndefined()

      const savedRoles = manager.save.mock.calls[1][0] as Array<{
        description?: string
        allowedIdentityProviders: string[] | null
      }>
      expect(savedRoles[0].description).toBeUndefined()
      expect(savedRoles[0].allowedIdentityProviders).toBeNull()
    })

    it('throws ConflictError when the name already exists', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: true }),
      )

      await expect(
        repo.saveSharedService(validCreateInput, asManager(manager)),
      ).rejects.toThrow(ConflictError)
      expect(manager.save).not.toHaveBeenCalled()
    })

    it('throws ConflictError when the display name already exists', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getExists: true }))

      await expect(
        repo.saveSharedService(validCreateInput, asManager(manager)),
      ).rejects.toThrow(ConflictError)
      expect(manager.save).not.toHaveBeenCalled()
    })

    it('throws ConflictError when the client identifier already exists', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getExists: true }))

      await expect(
        repo.saveSharedService(validCreateInput, asManager(manager)),
      ).rejects.toThrow(ConflictError)
      expect(manager.save).not.toHaveBeenCalled()
    })
  })

  describe('updateSharedService', () => {
    const existing = {
      id: 'ss-1',
      name: 'Old Name',
      displayName: 'Old Display',
      clientIdentifier: 'old-client',
    }

    it('patches only the provided fields', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { ...existing } }))
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'ss-1' } }))

      await repo.updateSharedService(
        { sharedServiceId: 'ss-1', name: 'New Name', updatedBy: 'system' },
        asManager(manager),
      )

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Name', updatedBy: 'system' }),
      )
    })

    it('allows clearing description with null', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { ...existing } }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'ss-1' } }))

      await repo.updateSharedService(
        { sharedServiceId: 'ss-1', description: null, updatedBy: 'system' },
        asManager(manager),
      )

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ description: null }),
      )
    })

    it('throws NotFoundError when the shared service does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.updateSharedService(
          { sharedServiceId: 'missing', updatedBy: 'system' },
          asManager(manager),
        ),
      ).rejects.toThrow(NotFoundError)
    })

    it('throws ConflictError when the new name is taken', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { ...existing } }))
        .mockReturnValueOnce(createQueryBuilder({ getExists: true }))

      await expect(
        repo.updateSharedService(
          { sharedServiceId: 'ss-1', name: 'New Name', updatedBy: 'system' },
          asManager(manager),
        ),
      ).rejects.toThrow(ConflictError)
    })

    it('throws ConflictError when the new display name is taken', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { ...existing } }))
        .mockReturnValueOnce(createQueryBuilder({ getExists: true }))

      await expect(
        repo.updateSharedService(
          {
            sharedServiceId: 'ss-1',
            displayName: 'New Display',
            updatedBy: 'system',
          },
          asManager(manager),
        ),
      ).rejects.toThrow(ConflictError)
    })

    it('throws ConflictError when the new client identifier is taken', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { ...existing } }))
        .mockReturnValueOnce(createQueryBuilder({ getExists: true }))

      await expect(
        repo.updateSharedService(
          {
            sharedServiceId: 'ss-1',
            clientIdentifier: 'new-client',
            updatedBy: 'system',
          },
          asManager(manager),
        ),
      ).rejects.toThrow(ConflictError)
    })

    it('does not run a uniqueness check when the value is unchanged', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: { ...existing } }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'ss-1' } }))

      await repo.updateSharedService(
        { sharedServiceId: 'ss-1', name: existing.name, updatedBy: 'system' },
        asManager(manager),
      )

      expect(manager.createQueryBuilder).toHaveBeenCalledTimes(2)
    })
  })

  describe('addSharedServiceRoles', () => {
    const activeService = { id: 'ss-1', name: 'Active Service' }
    const input = {
      sharedServiceId: 'ss-1',
      roles: [{ name: 'Role A' }, { name: 'Role B' }],
      updatedBy: 'system',
    }

    it('adds roles to an active shared service', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: activeService }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'ss-1' } }))

      await repo.addSharedServiceRoles(input, asManager(manager))

      expect(manager.save).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'Role A', isDeleted: false }),
        expect.objectContaining({ name: 'Role B', isDeleted: false }),
      ])
    })

    it('throws NotFoundError when the shared service is missing or inactive', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.addSharedServiceRoles(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
      expect(manager.save).not.toHaveBeenCalled()
    })

    it('rejects without saving any roles when one role name conflicts', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: activeService }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { id: 'existing-role' } }),
        )

      await expect(
        repo.addSharedServiceRoles(input, asManager(manager)),
      ).rejects.toThrow(ConflictError)
      expect(manager.save).not.toHaveBeenCalled()
    })
  })

  describe('updateSharedServiceRole', () => {
    const existingRole = { id: 'role-1', name: 'Old Role' }
    const baseInput = {
      sharedServiceId: 'ss-1',
      sharedServiceRoleId: 'role-1',
      updatedBy: 'system',
    }

    it('patches the provided fields', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { ...existingRole } }),
        )
        .mockReturnValueOnce(createQueryBuilder({ getExists: false }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'ss-1' } }))

      await repo.updateSharedServiceRole(
        { ...baseInput, name: 'New Role' },
        asManager(manager),
      )

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Role' }),
      )
    })

    it('allows clearing description and allowedIdentityProviders', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { ...existingRole } }),
        )
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'ss-1' } }))

      await repo.updateSharedServiceRole(
        { ...baseInput, description: null, allowedIdentityProviders: null },
        asManager(manager),
      )

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          allowedIdentityProviders: null,
        }),
      )
    })

    it('throws NotFoundError when the role does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.updateSharedServiceRole(baseInput, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })

    it('throws ConflictError when the new name is taken', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { ...existingRole } }),
        )
        .mockReturnValueOnce(createQueryBuilder({ getExists: true }))

      await expect(
        repo.updateSharedServiceRole(
          { ...baseInput, name: 'New Role' },
          asManager(manager),
        ),
      ).rejects.toThrow(ConflictError)
    })

    it('does not run a uniqueness check when the name is unchanged', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { ...existingRole } }),
        )
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'ss-1' } }))

      await repo.updateSharedServiceRole(
        { ...baseInput, name: existingRole.name },
        asManager(manager),
      )

      expect(manager.createQueryBuilder).toHaveBeenCalledTimes(2)
    })
  })

  describe('updateSharedServiceStatus', () => {
    it('disables an active shared service', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { id: 'ss-1', isActive: true } }),
        )
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'ss-1' } }))

      await repo.updateSharedServiceStatus(
        { sharedServiceId: 'ss-1', isActive: false, updatedBy: 'system' },
        asManager(manager),
      )

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      )
    })

    it('enables an inactive shared service', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(
          createQueryBuilder({ getOne: { id: 'ss-1', isActive: false } }),
        )
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'ss-1' } }))

      await repo.updateSharedServiceStatus(
        { sharedServiceId: 'ss-1', isActive: true, updatedBy: 'system' },
        asManager(manager),
      )

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
      )
    })

    it('throws NotFoundError when the shared service does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.updateSharedServiceStatus(
          { sharedServiceId: 'missing', isActive: true, updatedBy: 'system' },
          asManager(manager),
        ),
      ).rejects.toThrow(NotFoundError)
    })

    it('throws ConflictError when already inactive', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'ss-1', isActive: false } }),
      )

      await expect(
        repo.updateSharedServiceStatus(
          { sharedServiceId: 'ss-1', isActive: false, updatedBy: 'system' },
          asManager(manager),
        ),
      ).rejects.toThrow(ConflictError)
    })

    it('throws ConflictError when already active', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'ss-1', isActive: true } }),
      )

      await expect(
        repo.updateSharedServiceStatus(
          { sharedServiceId: 'ss-1', isActive: true, updatedBy: 'system' },
          asManager(manager),
        ),
      ).rejects.toThrow(ConflictError)
    })
  })

  describe('associateSharedServiceToTenant', () => {
    const input = {
      tenantId: 'tenant-1',
      sharedServiceId: 'ss-1',
      updatedBy: 'system',
    }
    const activeService = { id: 'ss-1', name: 'Active Service', isActive: true }

    it('associates an active shared service to a tenant', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: activeService }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'tenant-1' } }))

      await repo.associateSharedServiceToTenant(input, asManager(manager))

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ isDeleted: false }),
      )
    })

    it('throws NotFoundError when the shared service is missing', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.associateSharedServiceToTenant(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })

    it('throws ConflictError when the shared service is inactive', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { ...activeService, isActive: false } }),
      )

      await expect(
        repo.associateSharedServiceToTenant(input, asManager(manager)),
      ).rejects.toThrow(ConflictError)
    })

    it('throws ConflictError when already associated', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: activeService }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: { id: 'tss-1' } }))

      await expect(
        repo.associateSharedServiceToTenant(input, asManager(manager)),
      ).rejects.toThrow(ConflictError)
    })

    it('throws NotFoundError when the tenant is missing', async () => {
      manager.createQueryBuilder
        .mockReturnValueOnce(createQueryBuilder({ getOne: activeService }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))
        .mockReturnValueOnce(createQueryBuilder({ getOne: null }))

      await expect(
        repo.associateSharedServiceToTenant(input, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('getAllActiveSharedServices', () => {
    it('returns active shared services using the passed manager', async () => {
      const qb = createQueryBuilder({ getMany: [{ id: 'ss-1' }] })
      manager.createQueryBuilder.mockReturnValueOnce(qb)

      const result = await repo.getAllActiveSharedServices(asManager(manager))

      expect(result).toEqual([{ id: 'ss-1' }])
      expect(qb.where).toHaveBeenCalledWith(
        'sharedService.isActive = :isActive',
        { isActive: true },
      )
      expect(qb.andWhere).toHaveBeenCalledWith('roles.isDeleted = :isDeleted', {
        isDeleted: false,
      })
      expect(qb.orderBy).toHaveBeenCalledWith('sharedService.name', 'ASC')
      expect(getManager).not.toHaveBeenCalled()
    })

    it('returns an empty array when none are active', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getMany: [] }),
      )

      const result = await repo.getAllActiveSharedServices(asManager(manager))

      expect(result).toEqual([])
    })

    it('falls back to getManager when no manager is passed', async () => {
      const fallbackManager = createManager()
      fallbackManager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getMany: [] }),
      )
      ;(getManager as jest.Mock).mockReturnValueOnce(asManager(fallbackManager))

      await repo.getAllActiveSharedServices()

      expect(getManager).toHaveBeenCalledTimes(1)
      expect(fallbackManager.createQueryBuilder).toHaveBeenCalledTimes(1)
    })
  })

  describe('getSharedServicesForTenant', () => {
    it('returns the shared services for a tenant using the passed manager', async () => {
      const sharedService = { id: 'ss-1' }
      const qb = createQueryBuilder({ getMany: [{ sharedService }] })
      manager.createQueryBuilder.mockReturnValueOnce(qb)

      const result = await repo.getSharedServicesForTenant(
        { tenantId: 'tenant-1' },
        asManager(manager),
      )

      expect(result).toEqual([sharedService])
      expect(qb.where).toHaveBeenCalledWith('tss.tenant.id = :tenantId', {
        tenantId: 'tenant-1',
      })
      expect(getManager).not.toHaveBeenCalled()
    })

    it('returns an empty array when the tenant has no shared services', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getMany: [] }),
      )

      const result = await repo.getSharedServicesForTenant(
        { tenantId: 'tenant-1' },
        asManager(manager),
      )

      expect(result).toEqual([])
    })

    it('falls back to getManager when no manager is passed', async () => {
      const fallbackManager = createManager()
      fallbackManager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getMany: [] }),
      )
      ;(getManager as jest.Mock).mockReturnValueOnce(asManager(fallbackManager))

      await repo.getSharedServicesForTenant({ tenantId: 'tenant-1' })

      expect(getManager).toHaveBeenCalledTimes(1)
    })
  })

  describe('getSharedServiceWithRoles', () => {
    it('returns the shared service using the passed manager', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'ss-1' } }),
      )

      const result = await repo.getSharedServiceWithRoles(
        'ss-1',
        asManager(manager),
      )

      expect(result).toEqual({ id: 'ss-1' })
      expect(getManager).not.toHaveBeenCalled()
    })

    it('falls back to getManager when no manager is passed', async () => {
      const fallbackManager = createManager()
      fallbackManager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )
      ;(getManager as jest.Mock).mockReturnValueOnce(asManager(fallbackManager))

      const result = await repo.getSharedServiceWithRoles('ss-1')

      expect(result).toBeNull()
      expect(getManager).toHaveBeenCalledTimes(1)
    })
  })

  describe('existence checks', () => {
    const cases: Array<{
      label: string
      invoke: (mgr?: EntityManager) => Promise<boolean>
    }> = [
      {
        label: 'checkIfSharedServiceNameExists',
        invoke: (mgr) => repo.checkIfSharedServiceNameExists('Test Name', mgr),
      },
      {
        label: 'checkIfSharedServiceDisplayNameExists',
        invoke: (mgr) =>
          repo.checkIfSharedServiceDisplayNameExists('Test Display', mgr),
      },
      {
        label: 'checkIfSharedServiceClientIdentifierExists',
        invoke: (mgr) =>
          repo.checkIfSharedServiceClientIdentifierExists('test-client', mgr),
      },
    ]

    it.each(cases)(
      '$label resolves true or false using the passed manager',
      async ({ invoke }) => {
        manager.createQueryBuilder.mockReturnValueOnce(
          createQueryBuilder({ getExists: true }),
        )

        await expect(invoke(asManager(manager))).resolves.toBe(true)
        expect(getManager).not.toHaveBeenCalled()
      },
    )

    it.each(cases)(
      '$label falls back to getManager when no manager is passed',
      async ({ invoke }) => {
        const fallbackManager = createManager()
        fallbackManager.createQueryBuilder.mockReturnValueOnce(
          createQueryBuilder({ getExists: false }),
        )
        ;(getManager as jest.Mock).mockReturnValueOnce(
          asManager(fallbackManager),
        )

        await expect(invoke()).resolves.toBe(false)
        expect(getManager).toHaveBeenCalledTimes(1)
      },
    )
  })

  describe('checkIfTenantHasSharedServiceAccess', () => {
    it('returns true when the tenant has access using the passed manager', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: true }),
      )

      await expect(
        repo.checkIfTenantHasSharedServiceAccess(
          'tenant-1',
          'client-a',
          asManager(manager),
        ),
      ).resolves.toBe(true)
      expect(getManager).not.toHaveBeenCalled()
    })

    it('returns false when the tenant does not have access', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: false }),
      )

      await expect(
        repo.checkIfTenantHasSharedServiceAccess(
          'tenant-1',
          'client-a',
          asManager(manager),
        ),
      ).resolves.toBe(false)
    })

    it('falls back to getManager when no manager is passed', async () => {
      const fallbackManager = createManager()
      fallbackManager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getExists: false }),
      )
      ;(getManager as jest.Mock).mockReturnValueOnce(asManager(fallbackManager))

      await repo.checkIfTenantHasSharedServiceAccess('tenant-1', 'client-a')

      expect(getManager).toHaveBeenCalledTimes(1)
    })
  })
})
