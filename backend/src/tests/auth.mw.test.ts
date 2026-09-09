import request from 'supertest'
import express from 'express'
import { checkJwt, extractOidcSub, jwtErrorHandler } from '../common/auth.mw'
import logger from '../common/logger'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import { config } from '../services/config.service'

type JwtMiddleware = (
  req: express.Request,
  res: express.Response,
  next: (err?: unknown) => void,
) => void

let mockJwtOptions: Record<string, unknown>
let mockJwksOptions: Record<string, unknown>
let mockJwtBehaviour: JwtMiddleware

jest.mock('express-jwt', () => ({
  expressjwt: jest.fn((options: Record<string, unknown>) => {
    mockJwtOptions = options
    const middleware = ((req, res, next) =>
      mockJwtBehaviour(req, res, next)) as JwtMiddleware & { unless: jest.Mock }
    middleware.unless = jest.fn(() => middleware)
    return middleware
  }),
}))

jest.mock('jwks-rsa', () => ({
  expressJwtSecret: jest.fn((options: Record<string, unknown>) => {
    mockJwksOptions = options
    return 'mock-secret'
  }),
}))

jest.mock('../common/logger', () => ({
  __esModule: true,
  default: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

const mockLoggerError = logger.error as jest.Mock

const MY_USER_ID = 'F45AFBBD68C51D6F956BA3A1DE1878A2'

function signedInAs(decodedJwt: Record<string, unknown>) {
  mockJwtBehaviour = (req, _res, next) => {
    req.decodedJwt = decodedJwt
    next()
  }
}

function signInFailsWith(error: Error) {
  mockJwtBehaviour = (_req, _res, next) => next(error)
}

function createApp(
  path: string,
  options?: Parameters<typeof checkJwt>[0],
): express.Application {
  const app = express()
  app.get(path, checkJwt(options), (req, res) => {
    res.status(200).send({ idpType: req.idpType })
  })
  return app
}

beforeEach(() => {
  jest.clearAllMocks()
  signedInAs({ idir_user_guid: MY_USER_ID, idp: 'idir' })
})

describe('when the token is not valid', () => {
  it('sends back a 401 with a plain error message', async () => {
    signInFailsWith(new Error('jwt malformed'))

    const response = await request(createApp('/tenants')).get('/tenants')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      name: 'Unauthorized',
      message: 'Error occurred during authentication',
      httpResponseCode: 401,
      errorMessage: 'Unauthorized',
    })
  })

  it.each([
    ['No authorization token was found', 'invalid_token'],
    ['Bearer token is missing or invalid', 'missing_token'],
    ['jwt expired', 'token_expired'],
    ['jwt audience invalid', 'invalid_audience'],
    ['jwt issuer invalid', 'invalid_issuer'],
    ['invalid signature', 'invalid_signature'],
    ['something else went wrong', 'invalid_token'],
  ])('logs "%s" as %s', async (message, expectedReason) => {
    signInFailsWith(new Error(message))

    await request(createApp('/tenants')).get('/tenants')

    expect(mockLoggerError).toHaveBeenCalledWith(
      'JWT validation failed',
      expect.objectContaining({ reason: expectedReason }),
    )
  })

  it('uses the more detailed inner message when there is one', async () => {
    const error = Object.assign(new Error('outer'), {
      inner: { message: 'jwt expired' },
    })
    signInFailsWith(error)

    await request(createApp('/tenants')).get('/tenants')

    expect(mockLoggerError).toHaveBeenCalledWith(
      'JWT validation failed',
      expect.objectContaining({
        reason: 'token_expired',
        error: 'jwt expired',
      }),
    )
  })
})

describe('when the URL names a user', () => {
  it('lets you through when the URL is about you', async () => {
    const response = await request(createApp('/users/:ssoUserId')).get(
      `/users/${MY_USER_ID}`,
    )

    expect(response.status).toBe(200)
  })

  it('works the same for a BCeID sign in', async () => {
    signedInAs({ bceid_user_guid: MY_USER_ID, idp: 'idir' })

    const response = await request(createApp('/users/:ssoUserId')).get(
      `/users/${MY_USER_ID}`,
    )

    expect(response.status).toBe(200)
  })

  it('blocks you from looking at someone else', async () => {
    const response = await request(createApp('/users/:ssoUserId')).get(
      '/users/SOMEONEELSE',
    )

    expect(response.status).toBe(403)
    expect(response.body).toMatchObject({
      error: 'Forbidden',
      message:
        'Access denied - the requested user does not match the token user',
      statusCode: 403,
    })
  })

  it('lets an admin route skip that check', async () => {
    const app = createApp('/users/:ssoUserId', { skipSsoUserParamMatch: true })

    const response = await request(app).get('/users/SOMEONEELSE')

    expect(response.status).toBe(200)
  })
})

describe('signing in to CSTAR', () => {
  it.each(['idir', 'azureidir'])('lets %s users in', async (provider) => {
    signedInAs({ idir_user_guid: MY_USER_ID, idp: provider })

    const response = await request(createApp('/tenants')).get('/tenants')

    expect(response.status).toBe(200)
    expect(response.body.idpType).toBe('idir')
  })

  it('turns away anyone who is not an IDIR user', async () => {
    signedInAs({ idir_user_guid: MY_USER_ID, idp: 'bceidbusiness' })

    const response = await request(createApp('/tenants')).get('/tenants')

    expect(response.status).toBe(401)
    expect(response.body.message).toBe(
      'TMS endpoints require IDIR or Azure IDIR access',
    )
  })

  it('still works when the token names the provider differently', async () => {
    signedInAs({ idir_user_guid: MY_USER_ID, identity_provider: 'idir' })

    const response = await request(createApp('/tenants')).get('/tenants')

    expect(response.status).toBe(200)
  })
})

describe('when another service calls us', () => {
  const sharedService = { sharedServiceAccess: true }

  it('accepts a business BCeID sign in', async () => {
    signedInAs({ idp: 'bceidbusiness' })

    const response = await request(createApp('/tenants', sharedService)).get(
      '/tenants',
    )

    expect(response.status).toBe(200)
    expect(response.body.idpType).toBe('bceidbusiness')
  })

  it('accepts a bceidboth sign in that belongs to a business', async () => {
    signedInAs({ idp: 'bceidboth', bceid_business_guid: 'business-1' })

    const response = await request(createApp('/tenants', sharedService)).get(
      '/tenants',
    )

    expect(response.status).toBe(200)
    expect(response.body.idpType).toBe('bceidbusiness')
  })

  it('turns away a bceidboth sign in with no business', async () => {
    signedInAs({ idp: 'bceidboth' })

    const response = await request(createApp('/tenants', sharedService)).get(
      '/tenants',
    )

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Unsupported identity provider')
  })

  it.each(['idir', 'azureidir'])(
    'treats %s as an IDIR sign in',
    async (provider) => {
      signedInAs({ idp: provider })

      const response = await request(createApp('/tenants', sharedService)).get(
        '/tenants',
      )

      expect(response.status).toBe(200)
      expect(response.body.idpType).toBe('idir')
    },
  )

  it('turns away a sign in we do not recognise', async () => {
    signedInAs({ idp: 'facebook' })

    const response = await request(createApp('/tenants', sharedService)).get(
      '/tenants',
    )

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Unsupported identity provider')
  })

  it('lets a token with no provider through', async () => {
    signedInAs({})

    const response = await request(createApp('/tenants', sharedService)).get(
      '/tenants',
    )

    expect(response.status).toBe(200)
  })
})

describe('how the token check is set up', () => {
  it('only accepts tokens meant for CSTAR', () => {
    createApp('/tenants')

    expect(mockJwtOptions.audience).toBe(config.oidc.tmsAudience)
  })

  it('accepts tokens from other services too', () => {
    createApp('/tenants', { sharedServiceAccess: true })

    expect(mockJwtOptions.audience).toBeUndefined()
  })

  describe('pulling the token out of the request', () => {
    const getToken = () =>
      mockJwtOptions.getToken as (req: express.Request) => string

    beforeEach(() => {
      createApp('/tenants')
    })

    it('finds the token after the word Bearer', () => {
      const req = {
        headers: { authorization: 'Bearer abc123' },
      } as unknown as express.Request

      expect(getToken()(req)).toBe('abc123')
    })

    it.each([
      ['no authorization header', {}],
      ['a scheme we do not use', { authorization: 'Basic abc123' }],
      ['nothing after the word Bearer', { authorization: 'Bearer' }],
    ])('refuses when there is %s', (_label, headers) => {
      const req = { headers } as unknown as express.Request

      expect(() => getToken()(req)).toThrow(UnauthorizedError)
    })
  })

  it('treats a failure to fetch the signing key as a sign in failure', () => {
    createApp('/tenants')
    const handleSigningKeyError = mockJwksOptions.handleSigningKeyError as (
      err: Error,
      callback: (err: unknown) => void,
    ) => void
    const callback = jest.fn()

    handleSigningKeyError(new Error('jwks unreachable'), callback)

    expect(mockLoggerError).toHaveBeenCalledWith(
      'JWT signing key lookup failed',
      expect.objectContaining({ reason: 'jwks_error' }),
    )
    expect(callback).toHaveBeenCalledWith(expect.any(UnauthorizedError))
  })
})

describe('checking the token was read', () => {
  function createExtractApp() {
    const app = express()
    app.get('/me', checkJwt(), extractOidcSub, (_req, res) => {
      res.status(200).send({ ok: true })
    })
    return app
  }

  it('lets the request continue when we have a token', async () => {
    const response = await request(createExtractApp()).get('/me')

    expect(response.status).toBe(200)
  })

  it('stops the request when there is no token', async () => {
    mockJwtBehaviour = (_req, _res, next) => next()

    const response = await request(createExtractApp()).get('/me')

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      name: 'Unauthorized',
      message: 'Error occurred during authentication',
      httpResponseCode: 401,
      errorMessage: 'Unauthorized',
    })
  })
})

describe('the catch all for sign in errors', () => {
  function createErrorApp(error: unknown) {
    const app = express()
    app.get('/boom', (_req, _res, next) => next(error))
    app.use(jwtErrorHandler)
    return app
  }

  it('turns a sign in error into a 401', async () => {
    const response = await request(
      createErrorApp(new UnauthorizedError('jwt expired')),
    ).get('/boom')

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Error occurred during authentication')
  })

  it('leaves other errors alone', async () => {
    const response = await request(createErrorApp(new Error('db down'))).get(
      '/boom',
    )

    expect(response.status).toBe(500)
  })
})
