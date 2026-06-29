import { Response } from 'express'
import logger from './logger'

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
