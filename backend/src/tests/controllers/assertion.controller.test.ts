import { Request, Response } from 'express'
import { AssertionController } from '../../controllers/assertion.controller'
import { assertionService } from '../../services/assertion.service'
import { BadRequestError } from '../../errors/BadRequestError'
import { UnauthorizedError } from '../../errors/UnauthorizedError'
import { ForbiddenError } from '../../errors/ForbiddenError'
import { NotFoundError } from '../../errors/NotFoundError'
import { ConflictError } from '../../errors/ConflictError'

jest.mock('../../services/assertion.service')
jest.mock('../../common/logger')

const mockService = assertionService as jest.Mocked<typeof assertionService>

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

describe('AssertionController', () => {
  let controller: AssertionController
  let res: jest.Mocked<Response>

  beforeEach(() => {
    jest.clearAllMocks()
    controller = new AssertionController()
    res = createMockResponse()
  })

  const METHODS: Array<{
    method: keyof AssertionController
    context: string
    req: Partial<Request>
    successStatus: number
    result: unknown
  }> = [
    {
      method: 'createAssertion',
      context: 'Error occurred creating an assertion',
      req: {
        params: { tenantId: 'tenant-1' },
        body: { audience: 'notify-service' },
      },
      successStatus: 201,
      result: { data: { assertion: 'signed.assertion.value' } },
    },
    {
      method: 'verifyAssertion',
      context: 'Error occurred verifying an assertion',
      req: { headers: { 'x-cstar-assertion': 'signed.assertion.value' } },
      successStatus: 200,
      result: { data: { valid: true, tenantId: 'tenant-1' } },
    },
    {
      method: 'getJwks',
      context: 'Error occurred getting the JWKS',
      req: {},
      successStatus: 200,
      result: { keys: [{ kid: 'cstar-test-key' }] },
    },
  ]

  describe.each(METHODS)(
    '$method',
    ({ method, context, req, successStatus, result }) => {
      it(`responds ${successStatus} with the service result on success`, async () => {
        ;(mockService[method] as jest.Mock).mockResolvedValue(result)

        await controller[method](req as Request, res)

        expect(res.status).toHaveBeenCalledWith(successStatus)
        expect(res.send).toHaveBeenCalledWith(result)
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
