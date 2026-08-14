import request from 'supertest'
import express, { type ErrorRequestHandler } from 'express'
import { validate } from 'express-validation'
import validator from '../../common/tms.validator'

function createApp(
  method: 'post' | 'put' | 'patch',
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

const nameOfLength = (length: number) => 'a'.repeat(length)

const UUID = '123e4567-e89b-12d3-a456-426614174000'
const MINISTRY = 'Ministry of Natural Resources'
const USER = {
  firstName: 'Shankar',
  lastName: 'Sethuraman',
  displayName: 'Sethuraman, Shankar JEG:EX',
  userName: 'SSETHURA',
  ssoUserId: 'F45AFBBD68C44D6F956BA3A1D91878AD',
  email: 'shankar.sethuraman@gov.bc.ca',
}

const TENANT_USER = { ...USER, idpType: 'idir' }

function rejectedField(body: unknown): string {
  return JSON.stringify(body)
}

describe('tenant name length', () => {
  describe('createTenant', () => {
    const app = createApp('post', '/', validator.createTenant)

    const send = (name: string) =>
      request(app)
        .post('/')
        .send({ name, ministryName: MINISTRY, user: TENANT_USER })

    it('accepts a name of 255 characters', async () => {
      expect((await send(nameOfLength(255))).status).toBe(200)
    })

    it('rejects a name of 256 characters', async () => {
      const response = await send(nameOfLength(256))

      expect(response.status).toBe(400)
      expect(rejectedField(response.body)).toContain('name')
    })
  })

  describe('createTenantRequest', () => {
    const app = createApp('post', '/', validator.createTenantRequest)

    const send = (name: string) =>
      request(app).post('/').send({ name, ministryName: MINISTRY, user: USER })

    it('accepts a name of 255 characters', async () => {
      expect((await send(nameOfLength(255))).status).toBe(200)
    })

    it('rejects a name of 256 characters', async () => {
      const response = await send(nameOfLength(256))

      expect(response.status).toBe(400)
      expect(rejectedField(response.body)).toContain('name')
    })
  })

  describe('updateTenant', () => {
    const app = createApp('put', '/:tenantId', validator.updateTenant)

    const send = (name: string) => request(app).put(`/${UUID}`).send({ name })

    it('accepts a name of 255 characters', async () => {
      expect((await send(nameOfLength(255))).status).toBe(200)
    })

    it('rejects a name of 256 characters', async () => {
      const response = await send(nameOfLength(256))

      expect(response.status).toBe(400)
      expect(rejectedField(response.body)).toContain('name')
    })
  })

  describe('updateTenantRequestStatus tenantName', () => {
    const app = createApp(
      'patch',
      '/:requestId',
      validator.updateTenantRequestStatus,
    )

    const send = (tenantName: string) =>
      request(app).patch(`/${UUID}`).send({ status: 'APPROVED', tenantName })

    it('accepts a renamed tenant of 255 characters on approval', async () => {
      expect((await send(nameOfLength(255))).status).toBe(200)
    })

    it('rejects a renamed tenant of 256 characters on approval', async () => {
      const response = await send(nameOfLength(256))

      expect(response.status).toBe(400)
      expect(rejectedField(response.body)).toContain('tenantName')
    })
  })
})
