import request from 'supertest'
import express, { type ErrorRequestHandler } from 'express'
import { validate } from 'express-validation'
import validator from '../../common/tms.validator'

function createApp(
  method: 'get' | 'post' | 'patch',
  path: string,
  schema: Parameters<typeof validate>[0],
) {
  const app = express()
  app.use(express.json())
  app[method](path, validate(schema, {}, {}), (_req, res) =>
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

describe('tenant-request validators', () => {
  describe('createTenantRequest', () => {
    const app = createApp('post', '/', validator.createTenantRequest)

    it('accepts a valid payload', async () => {
      const response = await request(app).post('/').send({
        name: 'Roads Initiative',
        ministryName: 'Ministry of Natural Resources',
      })
      expect(response.status).toBe(200)
    })

    it('rejects a payload missing required fields', async () => {
      const response = await request(app).post('/').send({})
      expect(response.status).toBe(400)
    })
  })

  describe('updateTenantRequestStatus', () => {
    const app = createApp(
      'patch',
      '/:requestId/status',
      validator.updateTenantRequestStatus,
    )

    it('accepts APPROVED without a rejection reason', async () => {
      const response = await request(app)
        .patch(`/${VALID_UUID}/status`)
        .send({ status: 'APPROVED' })
      expect(response.status).toBe(200)
    })

    it('rejects REJECTED without a rejection reason', async () => {
      const response = await request(app)
        .patch(`/${VALID_UUID}/status`)
        .send({ status: 'REJECTED' })
      expect(response.status).toBe(400)
    })

    it('rejects an invalid request id', async () => {
      const response = await request(app)
        .patch('/not-a-uuid/status')
        .send({ status: 'APPROVED' })
      expect(response.status).toBe(400)
    })

    it('rejects tenantName when status is REJECTED', async () => {
      const response = await request(app).patch(`/${VALID_UUID}/status`).send({
        status: 'REJECTED',
        rejectionReason: 'Not enough information',
        tenantName: 'New Name',
      })
      expect(response.status).toBe(400)
    })
  })

  describe('getTenantRequests', () => {
    const app = createApp('get', '/', validator.getTenantRequests)

    it('accepts a valid status filter', async () => {
      const response = await request(app).get('/').query({ status: 'NEW' })
      expect(response.status).toBe(200)
    })

    it('rejects an invalid status value', async () => {
      const response = await request(app).get('/').query({ status: 'BOGUS' })
      expect(response.status).toBe(400)
    })
  })

  describe('getUserTenantRequests', () => {
    const app = createApp('get', '/:ssoUserId', validator.getUserTenantRequests)

    it('accepts a valid ssoUserId', async () => {
      const response = await request(app).get('/some-sso-id')
      expect(response.status).toBe(200)
    })

    it('rejects a too-short ssoUserId', async () => {
      const response = await request(app).get('/a')
      expect(response.status).toBe(400)
    })
  })
})
