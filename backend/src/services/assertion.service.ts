import { Request } from 'express'
import { randomUUID } from 'crypto'
import { TMSRepository } from '../repositories/tms.repository'
import { connection } from '../common/db.connection'
import { config } from '../services/config.service'
import { CreateAssertionInputDto } from '../dtos/tms.dto'
import { BadRequestError } from '../errors/BadRequestError'
import { ForbiddenError } from '../errors/ForbiddenError'
import { NotFoundError } from '../errors/NotFoundError'
import { SharedService } from '../entities/SharedService'

interface AssertionWellKnown {
  issuer: string
  jwks_uri: string
  assertion_endpoint: string
  id_token_signing_alg_values_supported: string[]
}

export class AssertionService {
  tmsRepository: TMSRepository

  constructor(tmsRepository?: TMSRepository) {
    this.tmsRepository = tmsRepository || new TMSRepository(connection.manager)
  }

  public async createAssertion(req: Request) {
    const sourceService = await this.getSourceSharedService(req)
    const ssoUserId = this.getSsoUserId(req)
    const input: CreateAssertionInputDto = {
      tenantId: req.body.tenantId,
      targetServiceClientId: req.body.targetServiceClientId,
      sourceServiceClientId: sourceService.clientIdentifier,
      ssoUserId,
    }

    const targetService =
      await this.tmsRepository.getActiveSharedServiceByClientIdentifier(
        input.targetServiceClientId,
      )

    if (!targetService) {
      throw new NotFoundError(
        `Target shared service not found: ${input.targetServiceClientId}`,
      )
    }

    await this.validateTenantAccess(input, sourceService, targetService)

    const expiresIn = config.assertions.expiresInSeconds
    const issuedAt = Math.floor(Date.now() / 1000)
    const expiresAtSeconds = issuedAt + expiresIn
    const expiresAt = new Date(expiresAtSeconds * 1000).toISOString()
    const assertion = await this.signAssertion(
      input,
      issuedAt,
      expiresAtSeconds,
    )

    return {
      data: {
        assertion,
        tokenType: 'Bearer',
        expiresIn,
        expiresAt,
      },
    }
  }

  public async getAssertionJwks() {
    const { exportJWK, importSPKI } = await import('jose')
    const publicKey = await importSPKI(
      this.normalizePem(config.assertions.publicKey),
      'RS256',
    )
    const jwk = await exportJWK(publicKey)

    return {
      keys: [
        {
          ...jwk,
          alg: 'RS256',
          kid: config.assertions.keyId,
          use: 'sig',
        },
      ],
    }
  }

  public getAssertionWellKnown(): AssertionWellKnown {
    const issuer = config.assertions.issuer.replace(/\/$/, '')

    return {
      issuer,
      jwks_uri: `${issuer}/v1/assertions/jwks`,
      assertion_endpoint: `${issuer}/v1/assertions`,
      id_token_signing_alg_values_supported: ['RS256'],
    }
  }

  private async getSourceSharedService(req: Request) {
    const candidates = this.getSourceServiceClientIdCandidates(req)

    for (const clientIdentifier of candidates) {
      const sharedService =
        await this.tmsRepository.getActiveSharedServiceByClientIdentifier(
          clientIdentifier,
        )

      if (sharedService) {
        return sharedService
      }
    }

    throw new NotFoundError(
      `Source shared service not found: ${candidates.join(', ')}`,
    )
  }

  private getSourceServiceClientIdCandidates(req: Request): string[] {
    const values = [req.decodedJwt?.aud, req.decodedJwt?.audience]
    const candidates = new Set<string>()

    values.forEach((value) => {
      if (typeof value === 'string' && value.trim()) {
        candidates.add(value)
      } else if (Array.isArray(value)) {
        value.forEach((candidate) => {
          if (typeof candidate === 'string' && candidate.trim()) {
            candidates.add(candidate)
          }
        })
      }
    })

    if (candidates.size === 0) {
      throw new BadRequestError('Source service client identifier not found')
    }

    return Array.from(candidates)
  }

  private getSsoUserId(req: Request): string {
    const ssoUserId =
      req.decodedJwt?.idir_user_guid || req.decodedJwt?.bceid_user_guid

    if (!ssoUserId) {
      throw new BadRequestError('SSO user identifier not found')
    }

    return ssoUserId
  }

  private async validateTenantAccess(
    input: CreateAssertionInputDto,
    sourceService: SharedService,
    targetService: SharedService,
  ) {
    const sourceServiceHasTenantAccess =
      await this.tmsRepository.checkIfTenantHasSharedServiceAccess(
        input.tenantId,
        sourceService.clientIdentifier,
      )

    if (!sourceServiceHasTenantAccess) {
      throw new ForbiddenError(
        `Source shared service is not associated with tenant: ${input.tenantId}`,
      )
    }

    const targetServiceHasTenantAccess =
      await this.tmsRepository.checkIfTenantHasSharedServiceAccess(
        input.tenantId,
        targetService.clientIdentifier,
      )

    if (!targetServiceHasTenantAccess) {
      throw new ForbiddenError(
        `Target shared service is not associated with tenant: ${input.tenantId}`,
      )
    }

    const userIsTenantMember =
      await this.tmsRepository.checkIfUserIsTenantMember(
        input.tenantId,
        input.ssoUserId,
      )

    if (!userIsTenantMember) {
      throw new ForbiddenError(
        `User is not a member of tenant: ${input.tenantId}`,
      )
    }
  }

  private async signAssertion(
    input: CreateAssertionInputDto,
    issuedAt: number,
    expiresAt: number,
  ) {
    const { importPKCS8, SignJWT } = await import('jose')
    const privateKey = await importPKCS8(
      this.normalizePem(config.assertions.privateKey),
      'RS256',
    )

    return await new SignJWT({
      azp: input.sourceServiceClientId,
      cstar: {
        ver: '1',
        tenantId: input.tenantId,
      },
    })
      .setProtectedHeader({
        alg: 'RS256',
        kid: config.assertions.keyId,
        typ: 'JWT',
      })
      .setIssuer(config.assertions.issuer)
      .setSubject(input.ssoUserId)
      .setAudience(input.targetServiceClientId)
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAt)
      .setJti(randomUUID())
      .sign(privateKey)
  }

  private normalizePem(value: string) {
    return value.replace(/\\n/g, '\n')
  }
}
