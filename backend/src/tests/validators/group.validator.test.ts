import request from 'supertest'
import express, { type ErrorRequestHandler } from 'express'
import { validate } from 'express-validation'
import validator from '../../common/tms.validator'

function createApp(
  method: 'get' | 'post' | 'put' | 'delete',
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

describe('group validators', () => {
  describe('createGroup', () => {
    const app = createApp('post', '/:tenantId/groups', validator.createGroup)

    it('accepts a valid payload', async () => {
      const response = await request(app)
        .post(`/${VALID_UUID}/groups`)
        .send({ name: 'Engineering' })
      expect(response.status).toBe(200)
    })

    it('rejects a payload missing the required name', async () => {
      const response = await request(app).post(`/${VALID_UUID}/groups`).send({})
      expect(response.status).toBe(400)
    })

    it('rejects an invalid tenant id', async () => {
      const response = await request(app)
        .post('/not-a-uuid/groups')
        .send({ name: 'Engineering' })
      expect(response.status).toBe(400)
    })
  })

  describe('updateGroup', () => {
    const app = createApp(
      'put',
      '/:tenantId/groups/:groupId',
      validator.updateGroup,
    )

    it('accepts a valid partial payload', async () => {
      const response = await request(app)
        .put(`/${VALID_UUID}/groups/${VALID_UUID}`)
        .send({ name: 'Updated Name' })
      expect(response.status).toBe(200)
    })

    it('rejects an invalid group id', async () => {
      const response = await request(app)
        .put(`/${VALID_UUID}/groups/not-a-uuid`)
        .send({ name: 'Updated Name' })
      expect(response.status).toBe(400)
    })
  })

  describe('addGroupUser', () => {
    const app = createApp(
      'post',
      '/:tenantId/groups/:groupId/users',
      validator.addGroupUser,
    )
    const validUser = {
      firstName: 'John',
      lastName: 'Smith',
      displayName: 'John Smith',
      ssoUserId: 'sso-1',
      idpType: 'idir',
    }

    it('accepts a valid payload', async () => {
      const response = await request(app)
        .post(`/${VALID_UUID}/groups/${VALID_UUID}/users`)
        .send({ user: validUser })
      expect(response.status).toBe(200)
    })

    it('rejects a payload missing the required user', async () => {
      const response = await request(app)
        .post(`/${VALID_UUID}/groups/${VALID_UUID}/users`)
        .send({})
      expect(response.status).toBe(400)
    })
  })

  describe('removeGroupUser', () => {
    const app = createApp(
      'delete',
      '/:tenantId/groups/:groupId/users/:groupUserId',
      validator.removeGroupUser,
    )

    it('accepts valid ids', async () => {
      const response = await request(app).delete(
        `/${VALID_UUID}/groups/${VALID_UUID}/users/${VALID_UUID}`,
      )
      expect(response.status).toBe(200)
    })

    it('rejects an invalid group user id', async () => {
      const response = await request(app).delete(
        `/${VALID_UUID}/groups/${VALID_UUID}/users/not-a-uuid`,
      )
      expect(response.status).toBe(400)
    })
  })

  describe('getGroup', () => {
    const app = createApp(
      'get',
      '/:tenantId/groups/:groupId',
      validator.getGroup,
    )

    it('accepts a valid expand value', async () => {
      const response = await request(app)
        .get(`/${VALID_UUID}/groups/${VALID_UUID}`)
        .query({ expand: 'groupUsers' })
      expect(response.status).toBe(200)
    })

    it('rejects an invalid expand value', async () => {
      const response = await request(app)
        .get(`/${VALID_UUID}/groups/${VALID_UUID}`)
        .query({ expand: 'bogus' })
      expect(response.status).toBe(400)
    })
  })

  describe('getTenantGroups', () => {
    const app = createApp('get', '/:tenantId/groups', validator.getTenantGroups)

    it('accepts a valid tenant id', async () => {
      const response = await request(app).get(`/${VALID_UUID}/groups`)
      expect(response.status).toBe(200)
    })

    it('rejects an invalid tenant id', async () => {
      const response = await request(app).get('/not-a-uuid/groups')
      expect(response.status).toBe(400)
    })
  })

  describe('updateSharedServiceRolesForGroup', () => {
    const app = createApp(
      'put',
      '/:tenantId/groups/:groupId/shared-service-roles',
      validator.updateSharedServiceRolesForGroup,
    )

    it('accepts a valid payload', async () => {
      const response = await request(app)
        .put(`/${VALID_UUID}/groups/${VALID_UUID}/shared-service-roles`)
        .send({
          sharedServices: [
            {
              id: VALID_UUID,
              sharedServiceRoles: [{ id: VALID_UUID, enabled: true }],
            },
          ],
        })
      expect(response.status).toBe(200)
    })

    it('rejects an empty sharedServices array', async () => {
      const response = await request(app)
        .put(`/${VALID_UUID}/groups/${VALID_UUID}/shared-service-roles`)
        .send({ sharedServices: [] })
      expect(response.status).toBe(400)
    })
  })

  describe('getUserGroupsWithSharedServiceRoles', () => {
    const app = createApp(
      'get',
      '/:tenantId/users/:ssoUserId/groups',
      validator.getUserGroupsWithSharedServiceRoles,
    )

    it('accepts valid ids', async () => {
      const response = await request(app).get(
        `/${VALID_UUID}/users/some-sso-id/groups`,
      )
      expect(response.status).toBe(200)
    })

    it('rejects an invalid tenant id', async () => {
      const response = await request(app).get(
        '/not-a-uuid/users/some-sso-id/groups',
      )
      expect(response.status).toBe(400)
    })
  })

  describe('getEffectiveSharedServiceRoles', () => {
    const app = createApp(
      'get',
      '/:tenantId/users/:ssoUserId/effective-roles',
      validator.getEffectiveSharedServiceRoles,
    )

    it('accepts valid ids', async () => {
      const response = await request(app).get(
        `/${VALID_UUID}/users/some-sso-id/effective-roles`,
      )
      expect(response.status).toBe(200)
    })

    it('rejects an invalid tenant id', async () => {
      const response = await request(app).get(
        '/not-a-uuid/users/some-sso-id/effective-roles',
      )
      expect(response.status).toBe(400)
    })
  })
})
