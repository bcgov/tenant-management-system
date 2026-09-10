import { Request } from 'express'
import { generateKeyPairSync } from 'crypto'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { AssertionService } from '../../services/assertion.service'
import { tenantRepository } from '../../repositories/tenant.repository'
import { config } from '../../services/config.service'

jest.mock('../../repositories/tenant.repository')
jest.mock('../../common/logger')

const TENANT_ID = 'tenant-1'
const CALLER = 'chefs-service'
const TARGET = 'notify-service'
const IDIR_USER = 'F45AFBBD68C44D6F956BA3A1D91878AD'
const BCEID_USER = 'A11BBCCD68C44D6F956BA3A1D9187000'

const mockRepository = tenantRepository as jest.Mocked<typeof tenantRepository>

interface RequestOptions {
  callingService?: unknown
  audience?: string
  idirUserGuid?: string
  bceidUserGuid?: string
  assertion?: unknown
}

function asRequest(options: RequestOptions): Request {
  return {
    params: { tenantId: TENANT_ID },
    body: { audience: options.audience },
    headers: { 'x-cstar-assertion': options.assertion },
    decodedJwt: {
      aud: options.callingService,
      idir_user_guid: options.idirUserGuid,
      bceid_user_guid: options.bceidUserGuid,
    },
  } as unknown as Request
}

function everythingBelongsToTheTenant() {
  mockRepository.checkIfTenantHasSharedServiceAccess.mockResolvedValue(
    true as never,
  )
  mockRepository.checkUserTenantAccess.mockResolvedValue(true as never)
}

function onlyTheseServicesBelong(...clientIdentifiers: string[]) {
  mockRepository.checkIfTenantHasSharedServiceAccess.mockImplementation(((
    _tenantId: string,
    clientIdentifier: string,
  ) => Promise.resolve(clientIdentifiers.includes(clientIdentifier))) as never)
}

function claimsOf(assertion: string): JwtPayload {
  return jwt.decode(assertion) as JwtPayload
}

function signWith(
  privateKey: string,
  claims: JwtPayload,
  options: jwt.SignOptions,
): string {
  return jwt.sign(claims, privateKey, { algorithm: 'RS256', ...options })
}

function aValidAssertion(overrides: jwt.SignOptions = {}): string {
  return signWith(
    config.assertion.privateKey,
    { azp: CALLER, tid: TENANT_ID, sub: IDIR_USER },
    {
      issuer: config.assertion.issuer,
      audience: TARGET,
      expiresIn: 300,
      ...overrides,
    },
  )
}

describe('AssertionService', () => {
  let service: AssertionService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new AssertionService()
    everythingBelongsToTheTenant()
  })

  describe('createAssertion', () => {
    it('signs an assertion holding the tenant and the calling service', async () => {
      const result = await service.createAssertion(
        asRequest({ callingService: CALLER, audience: TARGET }),
      )

      const claims = claimsOf(result.data.assertion)
      expect(claims.tid).toBe(TENANT_ID)
      expect(claims.azp).toBe(CALLER)
      expect(claims.aud).toBe(TARGET)
      expect(claims.iss).toBe(config.assertion.issuer)
    })

    it('names the signing key in the header so the target can find it', async () => {
      const result = await service.createAssertion(
        asRequest({ callingService: CALLER, audience: TARGET }),
      )

      const header = jwt.decode(result.data.assertion, {
        complete: true,
      })?.header
      expect(header?.kid).toBe(config.assertion.keyId)
      expect(header?.alg).toBe('RS256')
    })

    it('gives every assertion its own id', async () => {
      const first = await service.createAssertion(
        asRequest({ callingService: CALLER, audience: TARGET }),
      )
      const second = await service.createAssertion(
        asRequest({ callingService: CALLER, audience: TARGET }),
      )

      expect(claimsOf(first.data.assertion).jti).not.toBe(
        claimsOf(second.data.assertion).jti,
      )
    })

    it('includes the user when the request came from an IDIR user', async () => {
      const result = await service.createAssertion(
        asRequest({
          callingService: CALLER,
          audience: TARGET,
          idirUserGuid: IDIR_USER,
        }),
      )

      expect(claimsOf(result.data.assertion).sub).toBe(IDIR_USER)
    })

    it('includes the user when the request came from a BCeID user', async () => {
      const result = await service.createAssertion(
        asRequest({
          callingService: CALLER,
          audience: TARGET,
          bceidUserGuid: BCEID_USER,
        }),
      )

      expect(claimsOf(result.data.assertion).sub).toBe(BCEID_USER)
    })

    it('leaves the user out when a service called on its own behalf', async () => {
      const result = await service.createAssertion(
        asRequest({ callingService: CALLER, audience: TARGET }),
      )

      expect(claimsOf(result.data.assertion).sub).toBeUndefined()
      expect(mockRepository.checkUserTenantAccess).not.toHaveBeenCalled()
    })

    it('reports when the assertion expires', async () => {
      const result = await service.createAssertion(
        asRequest({ callingService: CALLER, audience: TARGET }),
      )

      const claims = claimsOf(result.data.assertion)
      const lifetimeInSeconds = Number(claims.exp) - Number(claims.iat)

      expect(lifetimeInSeconds).toBe(config.assertion.expiresInSeconds)
      expect(result.data.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('checks that both services belong to the tenant', async () => {
      await service.createAssertion(
        asRequest({ callingService: CALLER, audience: TARGET }),
      )

      expect(
        mockRepository.checkIfTenantHasSharedServiceAccess,
      ).toHaveBeenCalledWith(TENANT_ID, CALLER)
      expect(
        mockRepository.checkIfTenantHasSharedServiceAccess,
      ).toHaveBeenCalledWith(TENANT_ID, TARGET)
    })

    it('refuses when the token does not say which service is calling', async () => {
      await expect(
        service.createAssertion(asRequest({ audience: TARGET })),
      ).rejects.toThrow(
        'The request token does not identify a connected service',
      )
    })

    it('refuses when the token names more than one service', async () => {
      await expect(
        service.createAssertion(
          asRequest({ callingService: [CALLER, TARGET], audience: TARGET }),
        ),
      ).rejects.toThrow(
        'The request token does not identify a connected service',
      )
    })

    it('refuses when the calling service is not in the tenant', async () => {
      onlyTheseServicesBelong(TARGET)

      await expect(
        service.createAssertion(
          asRequest({ callingService: CALLER, audience: TARGET }),
        ),
      ).rejects.toThrow(
        `Connected service is not associated with this tenant: ${CALLER}`,
      )
    })

    it('refuses when the target service is not in the tenant', async () => {
      onlyTheseServicesBelong(CALLER)

      await expect(
        service.createAssertion(
          asRequest({ callingService: CALLER, audience: TARGET }),
        ),
      ).rejects.toThrow(
        `Connected service is not associated with this tenant: ${TARGET}`,
      )
    })

    it('refuses when the user is not in the tenant', async () => {
      mockRepository.checkUserTenantAccess.mockResolvedValue(false as never)

      await expect(
        service.createAssertion(
          asRequest({
            callingService: CALLER,
            audience: TARGET,
            idirUserGuid: IDIR_USER,
          }),
        ),
      ).rejects.toThrow(
        `Access denied: User does not belong to tenant: ${TENANT_ID}`,
      )
    })
  })

  describe('verifyAssertion', () => {
    it('accepts an assertion presented by the service it was made for', async () => {
      const result = await service.verifyAssertion(
        asRequest({ callingService: TARGET, assertion: aValidAssertion() }),
      )

      expect(result.data).toEqual({
        valid: true,
        tenantId: TENANT_ID,
        azp: CALLER,
        sub: IDIR_USER,
      })
    })

    it('rechecks the tenant relationships rather than trusting the signature', async () => {
      await service.verifyAssertion(
        asRequest({ callingService: TARGET, assertion: aValidAssertion() }),
      )

      expect(
        mockRepository.checkIfTenantHasSharedServiceAccess,
      ).toHaveBeenCalledWith(TENANT_ID, CALLER)
      expect(mockRepository.checkUserTenantAccess).toHaveBeenCalledWith(
        TENANT_ID,
        IDIR_USER,
      )
    })

    it('refuses once the service that issued it leaves the tenant', async () => {
      const assertion = aValidAssertion()
      onlyTheseServicesBelong(TARGET)

      await expect(
        service.verifyAssertion(
          asRequest({ callingService: TARGET, assertion }),
        ),
      ).rejects.toThrow(
        `Connected service is not associated with this tenant: ${CALLER}`,
      )
    })

    it('refuses when a different service presents someone else assertion', async () => {
      await expect(
        service.verifyAssertion(
          asRequest({
            callingService: 'workflow-service',
            assertion: aValidAssertion(),
          }),
        ),
      ).rejects.toThrow('The assertion is not valid')
    })

    it('refuses when the assertion header is missing', async () => {
      await expect(
        service.verifyAssertion(asRequest({ callingService: TARGET })),
      ).rejects.toThrow('The X-CSTAR-Assertion header is missing or invalid')
    })

    it('refuses when the assertion header is sent more than once', async () => {
      await expect(
        service.verifyAssertion(
          asRequest({
            callingService: TARGET,
            assertion: [aValidAssertion(), aValidAssertion()],
          }),
        ),
      ).rejects.toThrow('The X-CSTAR-Assertion header is missing or invalid')
    })

    it('refuses an assertion that has been altered', async () => {
      const altered = `${aValidAssertion().slice(0, -6)}AAAAAA`

      await expect(
        service.verifyAssertion(
          asRequest({ callingService: TARGET, assertion: altered }),
        ),
      ).rejects.toThrow('The assertion is not valid')
    })

    it('refuses an assertion signed with a key that is not ours', async () => {
      const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
      const forged = signWith(
        privateKey.export({ format: 'pem', type: 'pkcs8' }) as string,
        { azp: CALLER, tid: TENANT_ID },
        { issuer: config.assertion.issuer, audience: TARGET, expiresIn: 300 },
      )

      await expect(
        service.verifyAssertion(
          asRequest({ callingService: TARGET, assertion: forged }),
        ),
      ).rejects.toThrow('The assertion is not valid')
    })

    it('refuses an assertion that has expired', async () => {
      await expect(
        service.verifyAssertion(
          asRequest({
            callingService: TARGET,
            assertion: aValidAssertion({ expiresIn: -10 }),
          }),
        ),
      ).rejects.toThrow('The assertion is not valid')
    })

    it('refuses an assertion from an issuer we do not recognise', async () => {
      await expect(
        service.verifyAssertion(
          asRequest({
            callingService: TARGET,
            assertion: aValidAssertion({ issuer: 'someone-else' }),
          }),
        ),
      ).rejects.toThrow('The assertion is not valid')
    })

    it('refuses an assertion with no tenant in it', async () => {
      const noTenant = signWith(
        config.assertion.privateKey,
        { azp: CALLER },
        { issuer: config.assertion.issuer, audience: TARGET, expiresIn: 300 },
      )

      await expect(
        service.verifyAssertion(
          asRequest({ callingService: TARGET, assertion: noTenant }),
        ),
      ).rejects.toThrow('The assertion is missing tenant context')
    })

    it('refuses an assertion that does not say which service made it', async () => {
      const noAzp = signWith(
        config.assertion.privateKey,
        { tid: TENANT_ID },
        { issuer: config.assertion.issuer, audience: TARGET, expiresIn: 300 },
      )

      await expect(
        service.verifyAssertion(
          asRequest({ callingService: TARGET, assertion: noAzp }),
        ),
      ).rejects.toThrow('The assertion is missing tenant context')
    })

    it('refuses when the token does not say which service is calling', async () => {
      await expect(
        service.verifyAssertion(asRequest({ assertion: aValidAssertion() })),
      ).rejects.toThrow(
        'The request token does not identify a connected service',
      )
    })
  })

  describe('getJwks', () => {
    it('publishes one signing key', async () => {
      const result = await service.getJwks()

      expect(result.keys).toHaveLength(1)
      expect(result.keys[0]).toMatchObject({
        kty: 'RSA',
        alg: 'RS256',
        use: 'sig',
        kid: config.assertion.keyId,
      })
    })

    it('publishes a key that can check an assertion we signed', async () => {
      const result = await service.getJwks()
      const published = result.keys[0] as { n?: string; d?: string }

      expect(published.n).toBeDefined()
      expect(published.d).toBeUndefined()
    })
  })
})
