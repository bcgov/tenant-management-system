import { Request, Response } from 'express'
import { pocService } from './poc.service'
import { handleControllerError } from '../common/error.handler'

export class PocController {
  public async getTenants(req: Request, res: Response) {
    try {
      const response = await pocService.getTenants(req)
      res.status(200).send(response)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred getting POC tenants')
    }
  }

  public async getRoles(req: Request, res: Response) {
    try {
      const response = await pocService.getRoles(req)
      res.status(200).send(response)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred getting POC roles')
    }
  }

  public async getGroups(req: Request, res: Response) {
    try {
      const response = await pocService.getGroups(req)
      res.status(200).send(response)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred getting POC groups')
    }
  }
}

export const pocController = new PocController()
