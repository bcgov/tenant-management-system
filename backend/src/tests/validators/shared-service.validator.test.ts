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

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000'

describe('shared-service validators', () => {
  describe('createSharedService', () => {
    const app = createApp('post', '/', validator.createSharedService)
    const validBody = {
      name: 'Test Service',
      displayName: 'Test Service Display',
      clientIdentifier: 'test-client',
      landingPageUrl: 'https://example.gov.bc.ca',
      roles: [{ name: 'Admin Role' }],
    }

    it('accepts a valid payload', async () => {
      const response = await request(app).post('/').send(validBody)
      expect(response.status).toBe(200)
    })

    it('rejects a payload missing required fields', async () => {
      const response = await request(app).post('/').send({ name: 'Only Name' })
      expect(response.status).toBe(400)
    })

    it('rejects an empty roles array', async () => {
      const response = await request(app)
        .post('/')
        .send({ ...validBody, roles: [] })
      expect(response.status).toBe(400)
    })
  })

  describe('updateSharedService', () => {
    const app = createApp(
      'put',
      '/:sharedServiceId',
      validator.updateSharedService,
    )

    it('accepts a valid partial payload', async () => {
      const response = await request(app)
        .put(`/${VALID_UUID}`)
        .send({ name: 'Updated Name' })
      expect(response.status).toBe(200)
    })

    it('rejects an invalid shared service id', async () => {
      const response = await request(app)
        .put('/not-a-uuid')
        .send({ name: 'Updated Name' })
      expect(response.status).toBe(400)
    })

    it('rejects a body with no update fields', async () => {
      const response = await request(app).put(`/${VALID_UUID}`).send({})
      expect(response.status).toBe(400)
    })
  })

  describe('updateSharedServiceStatus', () => {
    const app = createApp(
      'patch',
      '/:sharedServiceId/status',
      validator.updateSharedServiceStatus,
    )

    it('accepts a valid payload', async () => {
      const response = await request(app)
        .patch(`/${VALID_UUID}/status`)
        .send({ isActive: false })
      expect(response.status).toBe(200)
    })

    it('rejects a missing isActive field', async () => {
      const response = await request(app)
        .patch(`/${VALID_UUID}/status`)
        .send({})
      expect(response.status).toBe(400)
    })
  })

  describe('associateSharedServiceToTenant', () => {
    const app = createApp(
      'post',
      '/:tenantId/shared-services',
      validator.associateSharedServiceToTenant,
    )

    it('accepts a valid payload', async () => {
      const response = await request(app)
        .post(`/${VALID_UUID}/shared-services`)
        .send({ sharedServiceId: VALID_UUID })
      expect(response.status).toBe(200)
    })

    it('rejects an invalid tenant id', async () => {
      const response = await request(app)
        .post('/not-a-uuid/shared-services')
        .send({ sharedServiceId: VALID_UUID })
      expect(response.status).toBe(400)
    })

    it('rejects a missing shared service id', async () => {
      const response = await request(app)
        .post(`/${VALID_UUID}/shared-services`)
        .send({})
      expect(response.status).toBe(400)
    })

    it('rejects an invalid shared service id', async () => {
      const response = await request(app)
        .post(`/${VALID_UUID}/shared-services`)
        .send({ sharedServiceId: 'not-a-uuid' })
      expect(response.status).toBe(400)
    })
  })

  describe('getSharedServicesForTenant', () => {
    const app = createApp(
      'post',
      '/:tenantId/shared-services/list',
      validator.getSharedServicesForTenant,
    )

    it('accepts a valid tenant id', async () => {
      const response = await request(app).post(
        `/${VALID_UUID}/shared-services/list`,
      )
      expect(response.status).toBe(200)
    })

    it('rejects an invalid tenant id', async () => {
      const response = await request(app).post(
        '/not-a-uuid/shared-services/list',
      )
      expect(response.status).toBe(400)
    })
  })

  describe('addSharedServiceRoles', () => {
    const app = createApp(
      'post',
      '/:sharedServiceId/shared-service-roles',
      validator.addSharedServiceRoles,
    )

    it('accepts a valid payload', async () => {
      const response = await request(app)
        .post(`/${VALID_UUID}/shared-service-roles`)
        .send({ roles: [{ name: 'New Role' }] })
      expect(response.status).toBe(200)
    })

    it('rejects a missing roles field', async () => {
      const response = await request(app)
        .post(`/${VALID_UUID}/shared-service-roles`)
        .send({})
      expect(response.status).toBe(400)
    })

    it('rejects an empty roles array', async () => {
      const response = await request(app)
        .post(`/${VALID_UUID}/shared-service-roles`)
        .send({ roles: [] })
      expect(response.status).toBe(400)
    })
  })

  describe('updateSharedServiceRole', () => {
    const app = createApp(
      'put',
      '/:sharedServiceId/shared-service-roles/:sharedServiceRoleId',
      validator.updateSharedServiceRole,
    )

    it('accepts a valid payload', async () => {
      const response = await request(app)
        .put(`/${VALID_UUID}/shared-service-roles/${VALID_UUID}`)
        .send({ name: 'Updated Role' })
      expect(response.status).toBe(200)
    })

    it('rejects an invalid shared service role id', async () => {
      const response = await request(app)
        .put(`/${VALID_UUID}/shared-service-roles/not-a-uuid`)
        .send({ name: 'Updated Role' })
      expect(response.status).toBe(400)
    })

    it('rejects a body with no update fields', async () => {
      const response = await request(app)
        .put(`/${VALID_UUID}/shared-service-roles/${VALID_UUID}`)
        .send({})
      expect(response.status).toBe(400)
    })
  })
})
