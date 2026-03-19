import request from 'supertest'
import express from 'express'
import { Routes } from '../routes/routes'
import { TMSController } from '../controllers/tms.controller'
import { TMController } from '../controllers/tm.controller'
import { checkJwt } from '../common/auth.mw'
import { checkTenantAccess } from '../common/tenant-access.mw'

jest.mock('../common/db.connection', () => ({
  connection: {
    manager: {
      transaction: jest.fn().mockImplementation((callback) => callback()),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    },
    initialize: jest.fn(),
    query: jest.fn(),
  },
}))

jest.mock('../common/auth.mw', () => ({
  checkJwt: jest.fn((options?: unknown) => {
    void options
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (req.headers.authorization === 'Bearer ok') {
        return next()
      }
      return res.status(401).json({ error: 'Unauthorized' })
    }
  }),
}))

jest.mock('../common/tenant-access.mw', () => ({
  checkTenantAccess: jest.fn((roles: string[]) => {
    void roles
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (req.headers['x-tenant-access'] === 'allow') {
        return next()
      }
      return res.status(403).json({ error: 'Forbidden' })
    }
  }),
}))

jest.mock('../common/operations-admin.mw', () => ({
  checkOperationsAdmin: (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    if (req.headers['x-ops-admin'] === 'allow') {
      return next()
    }
    return res.status(403).json({ error: 'Forbidden' })
  },
}))

describe('Routes middleware wiring', () => {
  let app: express.Application
  const mockedCheckJwt = checkJwt as jest.MockedFunction<typeof checkJwt>
  const mockedCheckTenantAccess = checkTenantAccess as jest.MockedFunction<
    typeof checkTenantAccess
  >

  beforeEach(() => {
    jest.clearAllMocks()
    app = express()
    app.use(express.json())

    jest
      .spyOn(TMSController.prototype, 'createTenant')
      .mockImplementation(async (_req, res) => {
        res.status(201).send({ ok: true })
      })
    jest
      .spyOn(TMSController.prototype, 'addTenantUser')
      .mockImplementation(async (_req, res) => {
        res.status(201).send({ ok: true })
      })
    jest
      .spyOn(TMSController.prototype, 'removeTenantUser')
      .mockImplementation(async (_req, res) => {
        res.status(204).send()
      })
    jest
      .spyOn(TMSController.prototype, 'getUsersForTenant')
      .mockImplementation(async (_req, res) => {
        res.status(200).send({ ok: true })
      })
    jest
      .spyOn(TMController.prototype, 'getTenantGroups')
      .mockImplementation(async (_req, res) => {
        res.status(200).send({ ok: true })
      })

    new Routes().routes(app)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should require JWT for adding a tenant user', async () => {
    const response = await request(app)
      .post('/v1/tenants/123e4567-e89b-12d3-a456-426614174000/users')
      .send({
        user: {
          firstName: 'Test',
          lastName: 'User',
          displayName: 'Test User',
          ssoUserId: 'F45AFBBD68C4466F956BA3A1D91878AD',
          email: 'test@gov.bc.ca',
          idpType: 'idir',
        },
        roles: ['123e4567-e89b-12d3-a456-426614174002'],
      })

    expect(response.status).toBe(401)
    expect(TMSController.prototype.addTenantUser).not.toHaveBeenCalled()
  })

  it('should require tenant access for removing a tenant user after JWT passes', async () => {
    const response = await request(app)
      .delete(
        '/v1/tenants/123e4567-e89b-12d3-a456-426614174000/users/123e4567-e89b-12d3-a456-426614174001',
      )
      .set('Authorization', 'Bearer ok')

    expect(response.status).toBe(403)
    expect(TMSController.prototype.removeTenantUser).not.toHaveBeenCalled()
  })

  it('should configure shared service JWT mode for get tenant users', () => {
    expect(mockedCheckJwt).toHaveBeenCalledWith({ sharedServiceAccess: true })
    expect(mockedCheckTenantAccess).toHaveBeenCalledWith([])
  })
})
