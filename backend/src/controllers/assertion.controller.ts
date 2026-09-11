import { Request, Response } from 'express'
import { assertionService } from '../services/assertion.service'
import { handleControllerError } from '../common/error.handler'

export class AssertionController {
  public async createAssertion(req: Request, res: Response) {
    try {
      const response = await assertionService.createAssertion(req)
      res.status(201).send(response)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred creating an assertion')
    }
  }

  public async verifyAssertion(req: Request, res: Response) {
    try {
      const response = await assertionService.verifyAssertion(req)
      res.status(200).send(response)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred verifying an assertion')
    }
  }

  public async getJwks(req: Request, res: Response) {
    try {
      const response = await assertionService.getJwks()
      res.status(200).send(response)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred getting the JWKS')
    }
  }
}

export const assertionController = new AssertionController()
