import { Request, Response } from 'express'
import { SharedServiceController } from '../../controllers/shared-service.controller'
import { sharedServiceService } from '../../services/shared-service.service'
import { BadRequestError } from '../../errors/BadRequestError'
import { UnauthorizedError } from '../../errors/UnauthorizedError'
import { ForbiddenError } from '../../errors/ForbiddenError'
import { NotFoundError } from '../../errors/NotFoundError'
import { ConflictError } from '../../errors/ConflictError'

jest.mock('../../services/shared-service.service')
jest.mock('../../common/db.connection', () => ({
  connection: { manager: { transaction: jest.fn() } },
}))

const mockService = sharedServiceService as jest.Mocked<
  typeof sharedServiceService
>

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

describe('SharedServiceController', () => {
  let controller: SharedServiceController
  let res: jest.Mocked<Response>

  beforeEach(() => {
    jest.clearAllMocks()
    controller = new SharedServiceController()
    res = createMockResponse()
  })

  const METHODS: Array<{
    method: keyof SharedServiceController
    context: string
    req: Partial<Request>
    successStatus: number
  }> = [
    {
      method: 'createSharedService',
      context: 'Error occurred creating shared service',
      req: { body: {} },
      successStatus: 201,
    },
    {
      method: 'updateSharedService',
      context: 'Error occurred updating shared service',
      req: { params: { sharedServiceId: 'ss-1' }, body: {} },
      successStatus: 200,
    },
    {
      method: 'addSharedServiceRoles',
      context: 'Error occurred adding shared service roles',
      req: { params: { sharedServiceId: 'ss-1' }, body: {} },
      successStatus: 201,
    },
    {
      method: 'updateSharedServiceRole',
      context: 'Error occurred updating shared service role',
      req: {
        params: { sharedServiceId: 'ss-1', sharedServiceRoleId: 'role-1' },
        body: {},
      },
      successStatus: 200,
    },
    {
      method: 'updateSharedServiceStatus',
      context: 'Error occurred updating shared service status',
      req: { params: { sharedServiceId: 'ss-1' }, body: {} },
      successStatus: 200,
    },
    {
      method: 'associateSharedServiceToTenant',
      context: 'Error occurred associating shared service to tenant',
      req: { params: { tenantId: 'tenant-1' }, body: {} },
      successStatus: 201,
    },
    {
      method: 'getAllActiveSharedServices',
      context: 'Error occurred getting active shared services',
      req: {},
      successStatus: 200,
    },
    {
      method: 'getSharedServicesForTenant',
      context: 'Error occurred getting shared services for tenant',
      req: { params: { tenantId: 'tenant-1' } },
      successStatus: 200,
    },
  ]

  describe.each(METHODS)(
    '$method',
    ({ method, context, req, successStatus }) => {
      it(`responds ${successStatus} with the service result on success`, async () => {
        const resolvedValue =
          method === 'associateSharedServiceToTenant'
            ? undefined
            : { data: { sharedService: { id: 'ss-1' } } }
        ;(mockService[method] as jest.Mock).mockResolvedValue(resolvedValue)

        await controller[method](req as Request, res)

        expect(res.status).toHaveBeenCalledWith(successStatus)
        if (resolvedValue === undefined) {
          expect(res.send).toHaveBeenCalledWith()
        } else {
          expect(res.send).toHaveBeenCalledWith(resolvedValue)
        }
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
})
