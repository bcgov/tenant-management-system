import { Request, Response } from 'express'
import { SSOSearchController } from '../../controllers/sso-search.controller'
import { ssoSearchService } from '../../services/sso-search.service'
import { BadRequestError } from '../../errors/BadRequestError'

jest.mock('../../services/sso-search.service')

const mockService = ssoSearchService as jest.Mocked<typeof ssoSearchService>

function createMockResponse(): jest.Mocked<Response> {
  const res = {} as jest.Mocked<Response>
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('SSOSearchController', () => {
  let controller: SSOSearchController
  let res: jest.Mocked<Response>
  const req = { query: { email: 'test@gov.bc.ca' } } as unknown as Request

  beforeEach(() => {
    jest.clearAllMocks()
    controller = new SSOSearchController()
    res = createMockResponse()
  })

  describe('searchBCGOVSSOUsers', () => {
    it('responds 200 with the search results on success', async () => {
      const results = { data: [{ guid: 'GUID-1' }] }
      mockService.searchBCGOVSSOUsers.mockResolvedValue(results)

      await controller.searchBCGOVSSOUsers(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith(results)
    })

    it('maps BadRequestError to 400', async () => {
      mockService.searchBCGOVSSOUsers.mockRejectedValue(
        new BadRequestError('BC GOV SSO API returned bad request: invalid'),
      )

      await controller.searchBCGOVSSOUsers(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Error occurred searching SSO users',
          httpResponseCode: 400,
          errorMessage: 'Bad Request',
        }),
      )
    })

    it('maps unexpected errors to 500', async () => {
      mockService.searchBCGOVSSOUsers.mockRejectedValue(
        new Error('Error invoking BC GOV SSO API'),
      )

      await controller.searchBCGOVSSOUsers(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Error occurred searching SSO users',
          httpResponseCode: 500,
          errorMessage: 'Internal Server Error',
        }),
      )
    })
  })

  describe('searchBCGOVSSOBceidUsers', () => {
    it('responds 200 with the search results on success', async () => {
      const results = { data: [{ guid: 'GUID-2' }] }
      mockService.searchBCGOVSSOBceidUsers.mockResolvedValue(results)

      await controller.searchBCGOVSSOBceidUsers(req, res)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith(results)
    })

    it('maps BadRequestError to 400', async () => {
      mockService.searchBCGOVSSOBceidUsers.mockRejectedValue(
        new BadRequestError(
          'BC GOV SSO BCEID API returned bad request: invalid',
        ),
      )

      await controller.searchBCGOVSSOBceidUsers(req, res)

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Error occurred searching BCEID users',
          httpResponseCode: 400,
          errorMessage: 'Bad Request',
        }),
      )
    })

    it('maps unexpected errors to 500', async () => {
      mockService.searchBCGOVSSOBceidUsers.mockRejectedValue(
        new Error('Error invoking BC GOV SSO BCEID API'),
      )

      await controller.searchBCGOVSSOBceidUsers(req, res)

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Error occurred searching BCEID users',
          httpResponseCode: 500,
          errorMessage: 'Internal Server Error',
        }),
      )
    })
  })
})
