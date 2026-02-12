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
  ) {
    res
      .status(httpResponseCode)
      .json({ name, message, httpResponseCode, errorMessage })
  }
}
