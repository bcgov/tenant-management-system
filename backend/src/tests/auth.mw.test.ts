import request from 'supertest'
import express from 'express'
import { checkJwt, extractOidcSub } from '../common/auth.mw'

jest.mock('express-jwt', () => ({
  expressjwt: jest.fn(() => {
    const middleware = (
      req: express.Request,
      _res: express.Response,
      next: express.NextFunction,
    ) => {
      req.decodedJwt = {
        idir_user_guid: req.headers['x-token-user-id'] as string,
        idp: (req.headers['x-token-idp'] as string) || 'idir',
      }
      next()
    }
    ;(middleware as typeof middleware & { unless: jest.Mock }).unless = jest.fn(
      () => middleware,
    )
    return middleware
  }),
}))

jest.mock('jwks-rsa', () => ({
  expressJwtSecret: jest.fn(() => 'mock-secret'),
}))

describe('checkJwt ssoUserId path matching', () => {
  let app: express.Application

  beforeEach(() => {
    app = express()
    app.get('/users/:ssoUserId', checkJwt(), (_req, res) => {
      res.status(200).send({ ok: true })
    })
    app.get(
      '/admin/users/:ssoUserId',
      checkJwt({ skipSsoUserParamMatch: true }),
      (_req, res) => {
        res.status(200).send({ ok: true })
      },
    )
  })

  it('allows requests when the token user matches the ssoUserId path parameter', async () => {
    const response = await request(app)
      .get('/users/F45AFBBD68C51D6F956BA3A1DE1878A2')
      .set('Authorization', 'Bearer ok')
      .set('x-token-user-id', 'F45AFBBD68C51D6F956BA3A1DE1878A2')

    expect(response.status).toBe(200)
  })

  it('rejects requests when the token user does not match the ssoUserId path parameter', async () => {
    const response = await request(app)
      .get('/users/F45AFBBD68C51D6F956BA3A1DE1878A2')
      .set('Authorization', 'Bearer ok')
      .set('x-token-user-id', 'DIFFERENTUSERID')

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({
      error: 'Forbidden',
      message:
        'Access denied - the requested user does not match the token user',
      statusCode: 403,
    })
  })

  it('allows mismatched ssoUserId path parameters when matching is explicitly skipped', async () => {
    const response = await request(app)
      .get('/admin/users/F45AFBBD68C51D6F956BA3A1DE1878A2')
      .set('Authorization', 'Bearer ok')
      .set('x-token-user-id', 'DIFFERENTUSERID')

    expect(response.status).toBe(200)
  })
})

describe('authentication failure responses', () => {
  it('rejects non-IDIR logins with the documented error body', async () => {
    const app = express()
    app.get('/tenants', checkJwt(), (_req, res) => {
      res.status(200).send({ ok: true })
    })

    const response = await request(app)
      .get('/tenants')
      .set('Authorization', 'Bearer ok')
      .set('x-token-idp', 'bceidbusiness')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      name: 'Unauthorized',
      message: 'TMS endpoints require IDIR or Azure IDIR access',
      httpResponseCode: 401,
      errorMessage: 'Unauthorized',
    })
  })

  it('rejects requests with no decoded token using the documented error body', async () => {
    const app = express()
    app.get('/tenants', extractOidcSub, (_req, res) => {
      res.status(200).send({ ok: true })
    })

    const response = await request(app).get('/tenants')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      name: 'Unauthorized',
      message: 'Error occurred during authentication',
      httpResponseCode: 401,
      errorMessage: 'Unauthorized',
    })
  })
})
