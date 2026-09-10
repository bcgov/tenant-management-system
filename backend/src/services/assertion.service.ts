import { Request } from 'express'
import { createPublicKey, randomUUID } from 'crypto'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { tenantRepository } from '../repositories/tenant.repository'
import { BadRequestError } from '../errors/BadRequestError'
import { ForbiddenError } from '../errors/ForbiddenError'
import { UnauthorizedError } from '../errors/UnauthorizedError'
import { config } from './config.service'
import {
  CreateAssertionInputDto,
  CreateAssertionResultDto,
  VerifyAssertionResultDto,
} from '../dtos/tms.dto'

const ALGORITHM = 'RS256'
const ASSERTION_HEADER = 'x-cstar-assertion'

export class AssertionService {
  private getCallingService(req: Request): string {
    const callingService = req.decodedJwt?.aud

    if (typeof callingService !== 'string' || !callingService) {
      throw new UnauthorizedError(
        'The request token does not identify a connected service',
      )
    }

    return callingService
  }

  private getSsoUserId(req: Request): string | undefined {
    return req.decodedJwt?.idir_user_guid || req.decodedJwt?.bceid_user_guid
  }

  private async checkServiceBelongsToTenant(
    tenantId: string,
    clientIdentifier: string,
  ) {
    const hasAccess =
      await tenantRepository.checkIfTenantHasSharedServiceAccess(
        tenantId,
        clientIdentifier,
      )

    if (!hasAccess) {
      throw new ForbiddenError(
        `Connected service is not associated with this tenant: ${clientIdentifier}`,
      )
    }
  }

  private async checkUserBelongsToTenant(tenantId: string, ssoUserId: string) {
    const hasAccess = await tenantRepository.checkUserTenantAccess(
      tenantId,
      ssoUserId,
    )

    if (!hasAccess) {
      throw new ForbiddenError(
        `Access denied: User does not belong to tenant: ${tenantId}`,
      )
    }
  }

  private async checkTenantContext(input: CreateAssertionInputDto) {
    await this.checkServiceBelongsToTenant(input.tenantId, input.callingService)
    await this.checkServiceBelongsToTenant(input.tenantId, input.audience)

    if (input.ssoUserId) {
      await this.checkUserBelongsToTenant(input.tenantId, input.ssoUserId)
    }
  }

  public async createAssertion(req: Request) {
    const input: CreateAssertionInputDto = {
      tenantId: req.params.tenantId,
      audience: req.body.audience,
      callingService: this.getCallingService(req),
      ssoUserId: this.getSsoUserId(req),
    }

    await this.checkTenantContext(input)

    const claims: JwtPayload = {
      azp: input.callingService,
      tid: input.tenantId,
      jti: randomUUID(),
    }

    if (input.ssoUserId) {
      claims.sub = input.ssoUserId
    }

    const assertion = jwt.sign(claims, config.assertion.privateKey, {
      algorithm: ALGORITHM,
      keyid: config.assertion.keyId,
      issuer: config.assertion.issuer,
      audience: input.audience,
      expiresIn: config.assertion.expiresInSeconds,
      notBefore: 0,
    })

    const result: CreateAssertionResultDto = {
      assertion,
      expiresAt: new Date(
        Date.now() + config.assertion.expiresInSeconds * 1000,
      ),
    }

    return { data: result }
  }

  private getAssertionFromHeader(req: Request): string {
    const assertion = req.headers[ASSERTION_HEADER]

    if (typeof assertion !== 'string' || !assertion) {
      throw new BadRequestError(
        'The X-CSTAR-Assertion header is missing or invalid',
      )
    }

    return assertion
  }

  private readAssertion(assertion: string, callingService: string): JwtPayload {
    try {
      return jwt.verify(assertion, config.assertion.publicKey, {
        algorithms: [ALGORITHM],
        issuer: config.assertion.issuer,
        audience: callingService,
      }) as JwtPayload
    } catch {
      throw new UnauthorizedError('The assertion is not valid')
    }
  }

  public async verifyAssertion(req: Request) {
    const callingService = this.getCallingService(req)
    const assertion = this.getAssertionFromHeader(req)
    const claims = this.readAssertion(assertion, callingService)

    const tenantId: string = claims.tid
    const azp: string = claims.azp

    if (!tenantId || !azp) {
      throw new UnauthorizedError('The assertion is missing tenant context')
    }

    await this.checkTenantContext({
      tenantId,
      audience: callingService,
      callingService: azp,
      ssoUserId: claims.sub,
    })

    const result: VerifyAssertionResultDto = {
      valid: true,
      tenantId,
      azp,
      sub: claims.sub,
    }

    return { data: result }
  }

  public async getJwks() {
    const publicKey = createPublicKey(config.assertion.publicKey)
    const jwk = publicKey.export({ format: 'jwk' })

    return {
      keys: [
        {
          ...jwk,
          alg: ALGORITHM,
          kid: config.assertion.keyId,
          use: 'sig',
        },
      ],
    }
  }
}

export const assertionService = new AssertionService()
