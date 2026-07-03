import { Request, Response } from 'express'
import { TenantRequestController } from '../../controllers/tenant-request.controller'
import { tenantRequestService } from '../../services/tenant-request.service'
import { BadRequestError } from '../../errors/BadRequestError'
import { UnauthorizedError } from '../../errors/UnauthorizedError'
import { ForbiddenError } from '../../errors/ForbiddenError'
import { NotFoundError } from '../../errors/NotFoundError'
import { ConflictError } from '../../errors/ConflictError'
import { TMSConstants } from '../../common/tms.constants'

jest.mock('../../services/tenant-request.service')
jest.mock('../../common/db.connection', () => ({
  connection: { manager: { transaction: jest.fn() } },
}))

const mockService = tenantRequestService as jest.Mocked<
  typeof tenantRequestService
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

describe('TenantRequestController', () => {
  let controller: TenantRequestController
  let res: jest.Mocked<Response>

  beforeEach(() => {
    jest.clearAllMocks()
    controller = new TenantRequestController()
    res = createMockResponse()
  })

  const METHODS: Array<{
    method: keyof TenantRequestController
    context: string
    req: Partial<Request>
    successStatus: number
  }> = [
    {
      method: 'createTenantRequest',
      context: 'Error occurred creating tenant request',
      req: { body: {} },
      successStatus: 201,
    },
    {
      method: 'updateTenantRequestStatus',
      context: 'Error occurred updating tenant request status',
      req: { params: { requestId: 'tr-1' }, body: {} },
      successStatus: 200,
    },
    {
      method: 'getTenantRequests',
      context: 'Error occurred getting tenant requests',
      req: { query: {} },
      successStatus: 200,
    },
    {
      method: 'getUserTenantRequests',
      context: 'Error occurred getting tenant requests',
      req: { params: { ssoUserId: 'sso-1' } },
      successStatus: 200,
    },
  ]

  describe.each(METHODS)(
    '$method',
    ({ method, context, req, successStatus }) => {
      it(`responds ${successStatus} with the service result on success`, async () => {
        const resolvedValue = { data: { tenantRequest: { id: 'tr-1' } } }
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

  it('forwards the ConflictError code on updateTenantRequestStatus', async () => {
    const conflict = new ConflictError(
      'Cannot update tenant request with status: APPROVED',
      TMSConstants.TENANT_REQUEST_INVALID_STATUS,
    )
    mockService.updateTenantRequestStatus.mockRejectedValue(conflict)

    await controller.updateTenantRequestStatus(
      { params: { requestId: 'tr-1' }, body: {} } as unknown as Request,
      res,
    )

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: TMSConstants.TENANT_REQUEST_INVALID_STATUS,
      }),
    )
  })
})
