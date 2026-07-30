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

export function sendErrorResponse(
  res: Response,
  name: string,
  message: string,
  httpResponseCode: number,
  errorMessage: string,
  code?: string,
): void {
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

    sendErrorResponse(res, name, message, httpResponseCode, errorMessage, code)
  }
}

export const errorHandler = new ErrorHandler()

export function handleControllerError(
  res: Response,
  error: unknown,
  context: string,
): void {
  const msg = getErrorMessage(error)
  if (error instanceof BadRequestError) {
    errorHandler.generalError(
      res,
      context,
      msg,
      error.statusCode,
      'Bad Request',
    )
  } else if (error instanceof UnauthorizedError) {
    errorHandler.generalError(
      res,
      context,
      msg,
      error.statusCode,
      'Unauthorized',
    )
  } else if (error instanceof ForbiddenError) {
    errorHandler.generalError(res, context, msg, error.statusCode, 'Forbidden')
  } else if (error instanceof NotFoundError) {
    errorHandler.generalError(res, context, msg, error.statusCode, 'Not Found')
  } else if (error instanceof ConflictError) {
    errorHandler.generalError(
      res,
      context,
      msg,
      error.statusCode,
      'Conflict',
      error.code,
    )
  } else {
    errorHandler.generalError(res, context, msg, 500, 'Internal Server Error')
  }
}
