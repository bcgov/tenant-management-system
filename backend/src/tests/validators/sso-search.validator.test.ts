import request from 'supertest'
import express, { type ErrorRequestHandler } from 'express'
import { validate } from 'express-validation'
import validator from '../../common/tms.validator'

function createApp(schema: Parameters<typeof validate>[0]) {
  const app = express()
  app.get('/search', validate(schema, {}, {}), (_req, res) =>
    res.status(200).json({ ok: true }),
  )
  const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (
      err &&
      typeof err === 'object' &&
      'name' in err &&
      (err as { name: string }).name === 'ValidationError'
    ) {
      return res.status((err as { statusCode: number }).statusCode).json(err)
    }
    next(err)
  }
  app.use(errorHandler)
  return app
}

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000'

describe('sso search validators', () => {
  describe('searchBCGOVSSOUsers', () => {
    const app = createApp(validator.searchBCGOVSSOUsers)

    it('accepts a search without a tenant', async () => {
      const response = await request(app).get('/search?email=sam@gov.bc.ca')
      expect(response.status).toBe(200)
    })

    it('accepts a search with a tenant', async () => {
      const response = await request(app).get(
        `/search?email=sam@gov.bc.ca&tenantId=${VALID_UUID}`,
      )
      expect(response.status).toBe(200)
    })

    it('rejects a tenant that is not an id', async () => {
      const response = await request(app).get(
        '/search?email=sam@gov.bc.ca&tenantId=not-an-id',
      )
      expect(response.status).toBe(400)
    })
  })

  describe('searchBCGOVSSOBceidUsers', () => {
    const app = createApp(validator.searchBCGOVSSOBceidUsers)

    it('accepts a search with a tenant', async () => {
      const response = await request(app).get(
        `/search?username=business.user&tenantId=${VALID_UUID}`,
      )
      expect(response.status).toBe(200)
    })

    it('rejects a tenant that is not an id', async () => {
      const response = await request(app).get(
        '/search?username=business.user&tenantId=not-an-id',
      )
      expect(response.status).toBe(400)
    })
  })
})
