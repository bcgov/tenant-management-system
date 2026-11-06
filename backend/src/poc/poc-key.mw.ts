import { Request, Response, NextFunction } from 'express'
import { timingSafeEqual } from 'crypto'
import { config } from '../services/config.service'
import { sendErrorResponse } from '../common/error.handler'

const POC_KEY_HEADER = 'x-cstar-poc-key'

const matchesPocKey = (value: unknown): boolean => {
  const expected = Buffer.from(config.pocApiKey ?? '')

  if (typeof value !== 'string' || !expected.length) {
    return false
  }

  const received = Buffer.from(value)

  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  )
}

export const checkPocKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!matchesPocKey(req.headers[POC_KEY_HEADER])) {
    return sendErrorResponse(
      res,
      'Unauthorized',
      'The POC key is missing or invalid',
      401,
      'Unauthorized',
    )
  }

  next()
}
