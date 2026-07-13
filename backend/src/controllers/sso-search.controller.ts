import { Request, Response } from 'express'
import { ssoSearchService } from '../services/sso-search.service'
import { handleControllerError } from '../common/error.handler'

export class SSOSearchController {
  public async searchBCGOVSSOUsers(req: Request, res: Response) {
    try {
      const users = await ssoSearchService.searchBCGOVSSOUsers(req)
      res.status(200).send(users)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred searching SSO users')
    }
  }

  public async searchBCGOVSSOBceidUsers(req: Request, res: Response) {
    try {
      const users = await ssoSearchService.searchBCGOVSSOBceidUsers(req)
      res.status(200).send(users)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred searching BCEID users')
    }
  }
}

export const ssoSearchController = new SSOSearchController()
