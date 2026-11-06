import { Response } from 'express'
import { handleControllerError } from '../common/error.handler'
import { ForbiddenError } from '../errors/ForbiddenError'

jest.mock('../common/logger')

function createMockResponse(): jest.Mocked<Response> {
  const res = {} as jest.Mocked<Response>
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('handleControllerError', () => {
  it('adds the code and details of a forbidden error to the response', () => {
    const res = createMockResponse()
    const otherServices = [
      { name: 'notify', displayName: 'Notify', roles: ['Admin'] },
    ]

    handleControllerError(
      res,
      new ForbiddenError(
        'Please confirm Notify',
        'OTHER_SERVICES_NOT_CONFIRMED',
        { otherServices },
      ),
      'Error adding user to group',
    )

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({
      name: 'Error adding user to group',
      message: 'Please confirm Notify',
      httpResponseCode: 403,
      errorMessage: 'Forbidden',
      code: 'OTHER_SERVICES_NOT_CONFIRMED',
      otherServices,
    })
  })

  it('sends the same plain 403 as before for a forbidden error with no extras', () => {
    const res = createMockResponse()

    handleControllerError(res, new ForbiddenError('No access'), 'Error')

    expect(res.json).toHaveBeenCalledWith({
      name: 'Error',
      message: 'No access',
      httpResponseCode: 403,
      errorMessage: 'Forbidden',
    })
  })
})
