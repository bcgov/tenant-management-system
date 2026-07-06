import { Request } from 'express'
import { TenantRequest } from '../entities/TenantRequest'
import { tenantRequestRepository } from '../repositories/tenant-request.repository'
import { connection } from '../common/db.connection'
import logger from '../common/logger'
import { getErrorMessage } from '../common/error.handler'
import {
  CreateTenantRequestInputDto,
  GetTenantRequestsInputDto,
  UpdateTenantRequestStatusInputDto,
  UpdateTenantRequestStatusResponseDto,
  UpdateTenantRequestStatusResultDto,
} from '../dtos/tms.dto'

export class TenantRequestService {
  private getTenantRequestUserFromToken(
    req: Request,
  ): CreateTenantRequestInputDto['user'] {
    const bodyUser =
      req.body.user && typeof req.body.user === 'object' ? req.body.user : {}
    const decodedJwt = req.decodedJwt
    const ssoUserId =
      decodedJwt?.idir_user_guid ||
      decodedJwt?.bceid_user_guid ||
      bodyUser.ssoUserId
    const firstName = decodedJwt?.given_name || bodyUser.firstName || ''
    const lastName = decodedJwt?.family_name || bodyUser.lastName || ''
    const displayName =
      decodedJwt?.display_name ||
      decodedJwt?.name ||
      bodyUser.displayName ||
      [firstName, lastName].filter(Boolean).join(' ') ||
      ssoUserId

    return {
      ssoUserId,
      firstName,
      lastName,
      displayName,
      userName: decodedJwt?.idir_username || bodyUser.userName || '',
      email: decodedJwt?.email || bodyUser.email || '',
      idpType: req.idpType || bodyUser.idpType || 'idir',
    }
  }

  private getDecisionedByUserFromToken(
    req: Request,
  ): UpdateTenantRequestStatusInputDto['decisionedByUser'] {
    return {
      ssoUserId: req.decodedJwt?.idir_user_guid || 'system',
      firstName: req.decodedJwt?.given_name || 'System',
      lastName: req.decodedJwt?.family_name || 'User',
      displayName:
        req.decodedJwt?.display_name || req.decodedJwt?.name || 'System User',
      userName: req.decodedJwt?.idir_username || 'system',
      email: req.decodedJwt?.email || 'system@gov.bc.ca',
      idpType: req.idpType || 'idir',
    }
  }

  private formatTenantRequests(tenantRequests: TenantRequest[]) {
    return tenantRequests.map((request) => ({
      ...request,
      createdBy: request.requestedBy?.displayName || 'system',
      requestedBy: request.requestedBy?.displayName,
      decisionedBy: request.decisionedBy?.displayName,
    }))
  }

  public async createTenantRequest(req: Request) {
    const input: CreateTenantRequestInputDto = {
      name: req.body.name,
      ministryName: req.body.ministryName,
      description: req.body.description,
      user: this.getTenantRequestUserFromToken(req),
    }
    const tenantRequest = await connection.manager.transaction(async (tx) => {
      try {
        return await tenantRequestRepository.saveTenantRequest(input, tx)
      } catch (error: unknown) {
        logger.error(
          'Create tenant request transaction failure - rolling back inserts ',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })
    return {
      data: {
        tenantRequest: {
          ...tenantRequest,
          requestedBy: tenantRequest.requestedBy?.displayName,
        },
      },
    }
  }

  public async updateTenantRequestStatus(req: Request) {
    const input: UpdateTenantRequestStatusInputDto = {
      requestId: req.params.requestId,
      status: req.body.status,
      rejectionReason: req.body.rejectionReason,
      tenantName: req.body.tenantName,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
      decisionedByUser: this.getDecisionedByUserFromToken(req),
    }
    const response: UpdateTenantRequestStatusResultDto =
      await connection.manager.transaction(async (tx) => {
        try {
          return await tenantRequestRepository.updateTenantRequestStatus(
            input,
            tx,
          )
        } catch (error: unknown) {
          logger.error(
            'Update tenant request status transaction failure - rolling back changes',
            { error: getErrorMessage(error) },
          )
          throw error
        }
      })

    const formattedResponse: UpdateTenantRequestStatusResponseDto = {
      data: {
        tenantRequest: {
          id: response.tenantRequest.id,
          name: response.tenantRequest.name,
          ministryName: response.tenantRequest.ministryName,
          description: response.tenantRequest.description,
          status: response.tenantRequest.status,
          requestedBy: response.tenantRequest.requestedBy?.displayName,
          decisionedBy: response.tenantRequest.decisionedBy?.displayName,
          decisionedAt: response.tenantRequest.decisionedAt,
          rejectionReason: response.tenantRequest.rejectionReason,
          createdBy: response.tenantRequest.createdBy,
          updatedBy: response.tenantRequest.updatedBy,
        },
      },
    }

    if (response.tenant) {
      formattedResponse.data.tenant = response.tenant
    }

    return formattedResponse
  }

  public async getTenantRequests(req: Request) {
    const status = req.query.status as
      | 'NEW'
      | 'APPROVED'
      | 'REJECTED'
      | undefined
    const input: GetTenantRequestsInputDto = { status }
    const tenantRequests =
      await tenantRequestRepository.getTenantRequests(input)

    return {
      data: {
        tenantRequests: this.formatTenantRequests(tenantRequests),
      },
    }
  }

  public async getUserTenantRequests(req: Request) {
    const input: GetTenantRequestsInputDto = {
      status: 'NEW',
      ssoUserId: req.params.ssoUserId,
    }
    const tenantRequests =
      await tenantRequestRepository.getTenantRequests(input)

    return {
      data: {
        tenantRequests: this.formatTenantRequests(tenantRequests),
      },
    }
  }
}

export const tenantRequestService = new TenantRequestService()
