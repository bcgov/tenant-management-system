import { Response } from 'express'
import logger from './logger'
import { BadRequestError } from '../errors/BadRequestError'
import { ConflictError } from '../errors/ConflictError'
import { ForbiddenError } from '../errors/ForbiddenError'
import { NotFoundError } from '../errors/NotFoundError'
import { UnauthorizedError } from '../errors/UnauthorizedError'

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export class ErrorHandler {
  public generalError(
    res: Response,
    name: string,
    message: string,
    httpResponseCode: number,
    errorMessage: string,
    code?: string,
  ) {
    logger.error(name, { message, httpResponseCode, errorMessage })

    const responseBody: {
      name: string
      message: string
      httpResponseCode: number
      errorMessage: string
      code?: string
    } = { name, message, httpResponseCode, errorMessage }

    if (code) {
      responseBody.code = code
    }

    res.status(httpResponseCode).json(responseBody)
  }
}

const handler = new ErrorHandler()

export function handleControllerError(
  res: Response,
  error: unknown,
  context: string,
): void {
  const msg = getErrorMessage(error)
  if (error instanceof BadRequestError) {
    handler.generalError(res, context, msg, error.statusCode, 'Bad Request')
  } else if (error instanceof UnauthorizedError) {
    handler.generalError(res, context, msg, error.statusCode, 'Unauthorized')
  } else if (error instanceof ForbiddenError) {
    handler.generalError(res, context, msg, error.statusCode, 'Forbidden')
  } else if (error instanceof NotFoundError) {
    handler.generalError(res, context, msg, error.statusCode, 'Not Found')
  } else if (error instanceof ConflictError) {
    handler.generalError(res, context, msg, error.statusCode, 'Conflict')
  } else {
    handler.generalError(res, context, msg, 500, 'Internal Server Error')
  }
}
