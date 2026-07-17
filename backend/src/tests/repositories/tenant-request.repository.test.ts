import { EntityManager } from 'typeorm'
import { TenantRequestRepository } from '../../repositories/tenant-request.repository'
import { tenantRepository } from '../../repositories/tenant.repository'
import { ConflictError } from '../../errors/ConflictError'
import { NotFoundError } from '../../errors/NotFoundError'
import { TMSConstants } from '../../common/tms.constants'
import { getManager } from '../../common/db.connection'

jest.mock('../../common/db.connection', () => ({
  getManager: jest.fn(),
}))
jest.mock('../../repositories/tenant.repository', () => ({
  tenantRepository: {
    checkIfTenantNameAndMinistryNameExists: jest.fn(),
    setSSOUser: jest.fn(),
    saveTenant: jest.fn(),
  },
}))

const mockTenantRepository = tenantRepository as jest.Mocked<
  typeof tenantRepository
>

type MockQueryBuilder = {
  where: jest.Mock
  andWhere: jest.Mock
  leftJoinAndSelect: jest.Mock
  orderBy: jest.Mock
  getOne: jest.Mock
  getMany: jest.Mock
}

function createQueryBuilder(
  overrides: { getOne?: unknown; getMany?: unknown[] } = {},
): MockQueryBuilder {
  const qb = {} as MockQueryBuilder
  const chained = ['where', 'andWhere', 'leftJoinAndSelect', 'orderBy'] as const
  chained.forEach((method) => {
    qb[method] = jest.fn().mockReturnValue(qb)
  })
  qb.getOne = jest.fn().mockResolvedValue(overrides.getOne ?? null)
  qb.getMany = jest.fn().mockResolvedValue(overrides.getMany ?? [])
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
      const record = entity as { id?: string }
      record.id = record.id ?? 'generated-id'
      return entity
    }),
  }
}

describe('TenantRequestRepository', () => {
  let repo: TenantRequestRepository
  let manager: MockManager

  beforeEach(() => {
    jest.clearAllMocks()
    repo = new TenantRequestRepository()
    manager = createManager()
  })

  const asManager = (m: MockManager) => m as unknown as EntityManager

  const decisionedByUser = {
    ssoUserId: 'admin-1',
    firstName: 'Admin',
    lastName: 'User',
    displayName: 'Admin User',
    userName: 'admin',
    email: 'admin@gov.bc.ca',
    idpType: 'idir' as const,
  }

  describe('saveTenantRequest', () => {
    const input = {
      name: 'Roads Initiative',
      ministryName: 'Ministry of Natural Resources',
      description: 'Tenant for roads',
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

    it('creates the tenant request', async () => {
      mockTenantRepository.checkIfTenantNameAndMinistryNameExists.mockResolvedValue(
        false,
      )
      mockTenantRepository.setSSOUser.mockResolvedValue({
        ssoUserId: 'sso-1',
        displayName: 'John Smith',
      } as never)
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({
          getOne: {
            id: 'tr-1',
            requestedBy: { displayName: 'John Smith' },
          },
        }),
      )

      const result = await repo.saveTenantRequest(input, asManager(manager))

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Roads Initiative',
          ministryName: 'Ministry of Natural Resources',
          description: 'Tenant for roads',
          status: 'NEW',
          createdBy: 'sso-1',
        }),
      )
      expect(result).toEqual(
        expect.objectContaining({ id: 'tr-1', createdBy: 'John Smith' }),
      )
    })

    it('throws ConflictError when a tenant with the same name and ministry already exists', async () => {
      mockTenantRepository.checkIfTenantNameAndMinistryNameExists.mockResolvedValue(
        true,
      )

      await expect(
        repo.saveTenantRequest(input, asManager(manager)),
      ).rejects.toThrow(ConflictError)
      expect(manager.save).not.toHaveBeenCalled()
    })
  })

  describe('updateTenantRequestStatus', () => {
    const rejectInput = {
      requestId: 'tr-1',
      status: 'REJECTED' as const,
      rejectionReason: 'Not enough information',
      updatedBy: 'admin-1',
      decisionedByUser,
    }
    const existingRequest = {
      id: 'tr-1',
      status: 'NEW',
      name: 'Roads Initiative',
      ministryName: 'Ministry of Natural Resources',
      requestedBy: {
        ssoUserId: 'sso-1',
        firstName: 'John',
        lastName: 'Smith',
        displayName: 'John Smith',
        userName: 'jsmith',
        email: 'john@gov.bc.ca',
        idpType: 'idir' as const,
      },
    }

    it('rejects a NEW request', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { ...existingRequest } }),
      )
      mockTenantRepository.setSSOUser.mockResolvedValue({
        ...decisionedByUser,
      } as never)

      const result = await repo.updateTenantRequestStatus(
        rejectInput,
        asManager(manager),
      )

      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'REJECTED',
          rejectionReason: 'Not enough information',
        }),
      )
      expect(result.tenantRequest).toBeDefined()
      expect(result.tenant).toBeUndefined()
    })

    it('approves a NEW request and creates a tenant', async () => {
      const approveInput = {
        ...rejectInput,
        status: 'APPROVED' as const,
        rejectionReason: undefined,
      }
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { ...existingRequest } }),
      )
      mockTenantRepository.checkIfTenantNameAndMinistryNameExists.mockResolvedValue(
        false,
      )
      mockTenantRepository.saveTenant.mockResolvedValue({
        id: 'tenant-1',
        name: 'Roads Initiative',
        ministryName: 'Ministry of Natural Resources',
        createdBy: 'sso-1',
        updatedBy: 'sso-1',
      } as never)
      mockTenantRepository.setSSOUser.mockResolvedValue({
        ...decisionedByUser,
      } as never)

      const result = await repo.updateTenantRequestStatus(
        approveInput,
        asManager(manager),
      )

      expect(mockTenantRepository.saveTenant).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Roads Initiative' }),
        manager,
      )
      expect(result.tenant).toEqual(
        expect.objectContaining({ id: 'tenant-1', name: 'Roads Initiative' }),
      )
    })

    it('throws NotFoundError when the request does not exist', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )

      await expect(
        repo.updateTenantRequestStatus(rejectInput, asManager(manager)),
      ).rejects.toThrow(NotFoundError)
    })

    it('throws ConflictError with TENANT_REQUEST_INVALID_STATUS when already decisioned', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({
          getOne: { ...existingRequest, status: 'APPROVED' },
        }),
      )

      await expect(
        repo.updateTenantRequestStatus(rejectInput, asManager(manager)),
      ).rejects.toMatchObject({
        code: TMSConstants.TENANT_REQUEST_INVALID_STATUS,
      })
    })

    it('throws ConflictError when rejecting without a reason', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { ...existingRequest } }),
      )

      await expect(
        repo.updateTenantRequestStatus(
          { ...rejectInput, rejectionReason: undefined },
          asManager(manager),
        ),
      ).rejects.toThrow(ConflictError)
    })

    it('throws ConflictError with TENANT_NAME_ALREADY_EXISTS when approving into a taken name', async () => {
      const approveInput = {
        ...rejectInput,
        status: 'APPROVED' as const,
        rejectionReason: undefined,
      }
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { ...existingRequest } }),
      )
      mockTenantRepository.checkIfTenantNameAndMinistryNameExists.mockResolvedValue(
        true,
      )

      await expect(
        repo.updateTenantRequestStatus(approveInput, asManager(manager)),
      ).rejects.toMatchObject({ code: TMSConstants.TENANT_NAME_ALREADY_EXISTS })
    })
  })

  describe('getTenantRequestById', () => {
    it('uses the passed manager', async () => {
      manager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: { id: 'tr-1' } }),
      )

      const result = await repo.getTenantRequestById('tr-1', asManager(manager))

      expect(result).toEqual({ id: 'tr-1' })
      expect(getManager).not.toHaveBeenCalled()
    })

    it('falls back to getManager when no manager is passed', async () => {
      const fallbackManager = createManager()
      fallbackManager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getOne: null }),
      )
      ;(getManager as jest.Mock).mockReturnValueOnce(asManager(fallbackManager))

      await repo.getTenantRequestById('tr-1')

      expect(getManager).toHaveBeenCalledTimes(1)
    })
  })

  describe('getTenantRequests', () => {
    it('filters by status and ssoUserId when provided', async () => {
      const qb = createQueryBuilder({ getMany: [{ id: 'tr-1' }] })
      manager.createQueryBuilder.mockReturnValueOnce(qb)

      const result = await repo.getTenantRequests(
        { status: 'NEW', ssoUserId: 'sso-1' },
        asManager(manager),
      )

      expect(result).toEqual([{ id: 'tr-1' }])
      expect(qb.where).toHaveBeenCalledWith('tenantRequest.status = :status', {
        status: 'NEW',
      })
      expect(qb.andWhere).toHaveBeenCalledWith(
        'requestedBy.ssoUserId = :ssoUserId',
        { ssoUserId: 'sso-1' },
      )
    })

    it('falls back to getManager when no manager is passed', async () => {
      const fallbackManager = createManager()
      fallbackManager.createQueryBuilder.mockReturnValueOnce(
        createQueryBuilder({ getMany: [] }),
      )
      ;(getManager as jest.Mock).mockReturnValueOnce(asManager(fallbackManager))

      await repo.getTenantRequests({})

      expect(getManager).toHaveBeenCalledTimes(1)
    })
  })
})
