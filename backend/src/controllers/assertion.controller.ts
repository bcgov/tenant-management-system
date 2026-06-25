import { Request, Response } from 'express'
import { AssertionService } from '../services/assertion.service'
import { ErrorHandler, getErrorMessage } from '../common/error.handler'
import { NotFoundError } from '../errors/NotFoundError'
import { BadRequestError } from '../errors/BadRequestError'
import { ForbiddenError } from '../errors/ForbiddenError'
import logger from '../common/logger'

export class AssertionController {
  assertionService: AssertionService = new AssertionService()
  errorHandler: ErrorHandler = new ErrorHandler()

  public async createAssertion(req: Request, res: Response) {
    try {
      const response = await this.assertionService.createAssertion(req)
      res.status(201).send(response)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (error instanceof BadRequestError) {
        this.errorHandler.generalError(
          res,
          'Error occurred creating assertion',
          getErrorMessage(error),
          error.statusCode,
          'Bad Request',
        )
      } else if (error instanceof NotFoundError) {
        this.errorHandler.generalError(
          res,
          'Error occurred creating assertion',
          getErrorMessage(error),
          error.statusCode,
          'Not Found',
        )
      } else if (error instanceof ForbiddenError) {
        this.errorHandler.generalError(
          res,
          'Error occurred creating assertion',
          getErrorMessage(error),
          error.statusCode,
          'Forbidden',
        )
      } else {
        this.errorHandler.generalError(
          res,
          'Error occurred creating assertion',
          getErrorMessage(error),
          500,
          'Internal Server Error',
        )
      }
    }
  }

  public async getAssertionJwks(_req: Request, res: Response) {
    try {
      const response = await this.assertionService.getAssertionJwks()
      res.status(200).send(response)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      this.errorHandler.generalError(
        res,
        'Error occurred getting assertion JWKS',
        getErrorMessage(error),
        500,
        'Internal Server Error',
      )
    }
  }

  public getAssertionWellKnown(_req: Request, res: Response) {
    try {
      const response = this.assertionService.getAssertionWellKnown()
      res.status(200).send(response)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      this.errorHandler.generalError(
        res,
        'Error occurred getting assertion well-known configuration',
        getErrorMessage(error),
        500,
        'Internal Server Error',
      )
    }
  }
}
