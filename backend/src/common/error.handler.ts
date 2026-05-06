import { Response } from 'express'

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
