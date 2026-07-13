import { Request, Response } from 'express'
import { GroupController } from '../../controllers/group.controller'
import { groupService } from '../../services/group.service'
import { BadRequestError } from '../../errors/BadRequestError'
import { UnauthorizedError } from '../../errors/UnauthorizedError'
import { ForbiddenError } from '../../errors/ForbiddenError'
import { NotFoundError } from '../../errors/NotFoundError'
import { ConflictError } from '../../errors/ConflictError'

jest.mock('../../services/group.service')
jest.mock('../../common/db.connection', () => ({
  connection: { manager: { transaction: jest.fn() } },
}))

const mockService = groupService as jest.Mocked<typeof groupService>

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

describe('GroupController', () => {
  let controller: GroupController
  let res: jest.Mocked<Response>

  beforeEach(() => {
    jest.clearAllMocks()
    controller = new GroupController()
    res = createMockResponse()
  })

  const METHODS: Array<{
    method: keyof GroupController
    context: string
    req: Partial<Request>
    successStatus: number
  }> = [
    {
      method: 'createGroup',
      context: 'Error occurred creating group',
      req: { params: { tenantId: 'tenant-1' }, body: {} },
      successStatus: 201,
    },
    {
      method: 'addGroupUser',
      context: 'Error occurred adding user to group',
      req: { params: { tenantId: 'tenant-1', groupId: 'group-1' }, body: {} },
      successStatus: 201,
    },
    {
      method: 'updateGroup',
      context: 'Error occurred updating group',
      req: { params: { tenantId: 'tenant-1', groupId: 'group-1' }, body: {} },
      successStatus: 200,
    },
    {
      method: 'getGroup',
      context: 'Error occurred getting a group',
      req: { params: { tenantId: 'tenant-1', groupId: 'group-1' } },
      successStatus: 200,
    },
    {
      method: 'getTenantGroups',
      context: 'Error occurred getting tenant groups',
      req: { params: { tenantId: 'tenant-1' } },
      successStatus: 200,
    },
    {
      method: 'getSharedServiceRolesForGroup',
      context: 'Error occurred getting shared service roles for group',
      req: { params: { tenantId: 'tenant-1', groupId: 'group-1' } },
      successStatus: 200,
    },
    {
      method: 'updateSharedServiceRolesForGroup',
      context: 'Error occurred updating shared service roles for group',
      req: {
        params: { tenantId: 'tenant-1', groupId: 'group-1' },
        body: { sharedServices: [] },
      },
      successStatus: 200,
    },
    {
      method: 'getUserGroupsWithSharedServiceRoles',
      context: 'Error occurred getting user groups with shared services',
      req: { params: { tenantId: 'tenant-1', ssoUserId: 'sso-1' } },
      successStatus: 200,
    },
    {
      method: 'getEffectiveSharedServiceRoles',
      context: 'Error occurred getting effective shared service roles',
      req: { params: { tenantId: 'tenant-1', ssoUserId: 'sso-1' } },
      successStatus: 200,
    },
  ]

  describe.each(METHODS)(
    '$method',
    ({ method, context, req, successStatus }) => {
      it(`responds ${successStatus} with the service result on success`, async () => {
        const resolvedValue = { data: { group: { id: 'group-1' } } }
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

  describe('removeGroupUser', () => {
    const req = {
      params: { tenantId: 'tenant-1', groupId: 'group-1', groupUserId: 'gu-1' },
    } as unknown as Request

    it('responds 204 with no body on success', async () => {
      mockService.removeGroupUser.mockResolvedValue({
        data: { message: 'ok' },
      })

      await controller.removeGroupUser(req, res)

      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalledWith()
    })

    it.each(ERROR_CASES)(
      'maps $error.name to $httpResponseCode',
      async ({ error, httpResponseCode, errorMessage }) => {
        mockService.removeGroupUser.mockRejectedValue(error)

        await controller.removeGroupUser(req, res)

        expect(res.status).toHaveBeenCalledWith(httpResponseCode)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Error occurred removing user from group',
            message: error.message,
            httpResponseCode,
            errorMessage,
          }),
        )
      },
    )
  })
})
