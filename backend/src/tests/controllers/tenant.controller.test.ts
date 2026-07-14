import { Request, Response } from 'express'
import { TenantController } from '../../controllers/tenant.controller'
import { tenantService } from '../../services/tenant.service'
import { BadRequestError } from '../../errors/BadRequestError'
import { UnauthorizedError } from '../../errors/UnauthorizedError'
import { ForbiddenError } from '../../errors/ForbiddenError'
import { NotFoundError } from '../../errors/NotFoundError'
import { ConflictError } from '../../errors/ConflictError'

jest.mock('../../services/tenant.service')
jest.mock('../../common/db.connection', () => ({
  connection: { manager: { transaction: jest.fn() } },
}))

const mockService = tenantService as jest.Mocked<typeof tenantService>

function createMockResponse(): jest.Mocked<Response> {
  const res = {} as jest.Mocked<Response>
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

const ERROR_CASES = [
  {
    error: new BadRequestError('bad input'),
    httpResponseCode: 400,
    errorMessage: 'Bad Request',
  },
  {
    error: new UnauthorizedError('not authenticated'),
    httpResponseCode: 401,
    errorMessage: 'Unauthorized',
  },
  {
    error: new ForbiddenError('not allowed'),
    httpResponseCode: 403,
    errorMessage: 'Forbidden',
  },
  {
    error: new NotFoundError('missing'),
    httpResponseCode: 404,
    errorMessage: 'Not Found',
  },
  {
    error: new ConflictError('conflict'),
    httpResponseCode: 409,
    errorMessage: 'Conflict',
  },
  {
    error: new Error('unexpected'),
    httpResponseCode: 500,
    errorMessage: 'Internal Server Error',
  },
]

describe('TenantController', () => {
  let controller: TenantController
  let res: jest.Mocked<Response>

  beforeEach(() => {
    jest.clearAllMocks()
    controller = new TenantController()
    res = createMockResponse()
  })

  const METHODS: Array<{
    method: keyof TenantController
    context: string
    req: Partial<Request>
    successStatus: number
  }> = [
    {
      method: 'createTenant',
      context: 'Error occurred during tenant creation',
      req: { body: {} },
      successStatus: 201,
    },
    {
      method: 'addTenantUser',
      context: 'Error occurred adding user to the tenant',
      req: { params: { tenantId: 'tenant-1' }, body: {} },
      successStatus: 201,
    },
    {
      method: 'getTenantsForUser',
      context: 'Error occurred getting tenants for a user',
      req: { params: { ssoUserId: 'sso-1' }, query: {} },
      successStatus: 200,
    },
    {
      method: 'getUsersForTenant',
      context: 'Error occurred getting users for a tenant',
      req: { params: { tenantId: 'tenant-1' }, query: {} },
      successStatus: 200,
    },
    {
      method: 'createRoles',
      context: 'Error occurred creating role',
      req: { params: { tenantId: 'tenant-1' }, body: {} },
      successStatus: 201,
    },
    {
      method: 'assignUserRoles',
      context: 'Error occurred assigning user role',
      req: {
        params: { tenantId: 'tenant-1', tenantUserId: 'tu-1' },
        body: {},
      },
      successStatus: 201,
    },
    {
      method: 'getTenantRoles',
      context: 'Error occurred getting tenant roles',
      req: { params: { tenantId: 'tenant-1' } },
      successStatus: 200,
    },
    {
      method: 'getUserRoles',
      context: 'Error occurred getting roles for user',
      req: { params: { tenantId: 'tenant-1', tenantUserId: 'tu-1' } },
      successStatus: 200,
    },
    {
      method: 'getTenant',
      context: 'Error occurred getting a tenant',
      req: { params: { tenantId: 'tenant-1' }, query: {} },
      successStatus: 200,
    },
    {
      method: 'updateTenant',
      context: 'Error occurred updating tenant',
      req: { params: { tenantId: 'tenant-1' }, body: {} },
      successStatus: 200,
    },
    {
      method: 'getRolesForSSOUser',
      context: 'Error occurred getting roles for SSO user',
      req: { params: { tenantId: 'tenant-1', ssoUserId: 'sso-1' } },
      successStatus: 200,
    },
    {
      method: 'getTenantUser',
      context: 'Error occurred getting tenant user',
      req: {
        params: { tenantId: 'tenant-1', tenantUserId: 'tu-1' },
        query: {},
      },
      successStatus: 200,
    },
  ]

  describe.each(METHODS)(
    '$method',
    ({ method, context, req, successStatus }) => {
      it(`responds ${successStatus} with the service result on success`, async () => {
        const resolvedValue = { data: { tenant: { id: 'tenant-1' } } }
        ;(mockService[method] as jest.Mock).mockResolvedValue(resolvedValue)

        await controller[method](req as Request, res)

        expect(res.status).toHaveBeenCalledWith(successStatus)
        expect(res.send).toHaveBeenCalledWith(resolvedValue)
      })

      it.each(ERROR_CASES)(
        'maps $error.name to $httpResponseCode',
        async ({ error, httpResponseCode, errorMessage }) => {
          ;(mockService[method] as jest.Mock).mockRejectedValue(error)

          await controller[method](req as Request, res)

          expect(res.status).toHaveBeenCalledWith(httpResponseCode)
          expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
              name: context,
              message: error.message,
              httpResponseCode,
              errorMessage,
            }),
          )
        },
      )
    },
  )

  describe.each([
    {
      method: 'unassignUserRoles' as const,
      context: 'Error occurred unassigning user role',
      req: {
        params: {
          tenantId: 'tenant-1',
          tenantUserId: 'tu-1',
          roleId: 'role-1',
        },
      } as unknown as Request,
    },
    {
      method: 'removeTenantUser' as const,
      context: 'Error occurred removing tenant user',
      req: {
        params: { tenantId: 'tenant-1', tenantUserId: 'tu-1' },
      } as unknown as Request,
    },
  ])('$method', ({ method, context, req }) => {
    it('responds 204 with no body on success', async () => {
      ;(mockService[method] as jest.Mock).mockResolvedValue(undefined)

      await controller[method](req, res)

      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalledWith()
    })

    it.each(ERROR_CASES)(
      'maps $error.name to $httpResponseCode',
      async ({ error, httpResponseCode, errorMessage }) => {
        ;(mockService[method] as jest.Mock).mockRejectedValue(error)

        await controller[method](req, res)

        expect(res.status).toHaveBeenCalledWith(httpResponseCode)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            name: context,
            message: error.message,
            httpResponseCode,
            errorMessage,
          }),
        )
      },
    )
  })
})
