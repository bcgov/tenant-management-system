import { EntityManager } from 'typeorm'
import { TenantRequest } from '../entities/TenantRequest'
import { Tenant } from '../entities/Tenant'
import { tmsRepository } from './tms.repository'
import { ConflictError } from '../errors/ConflictError'
import { NotFoundError } from '../errors/NotFoundError'
import { UnexpectedStateError } from '../errors/UnexpectedStateError'
import { getManager } from '../common/db.connection'
import { IdpType, TMSConstants } from '../common/tms.constants'
import {
  CreateTenantInputDto,
  CreateTenantRequestInputDto,
  GetTenantRequestsInputDto,
  UpdateTenantRequestStatusInputDto,
  UpdateTenantRequestStatusResultDto,
} from '../dtos/tms.dto'

export class TenantRequestRepository {
  public async saveTenantRequest(
    input: CreateTenantRequestInputDto,
    manager: EntityManager,
  ) {
    if (
      await tmsRepository.checkIfTenantNameAndMinistryNameExists(
        input.name,
        input.ministryName,
      )
    ) {
      throw new ConflictError(
        `A tenant with name '${input.name}' and ministry name '${input.ministryName}' already exists`,
      )
    }

    const tenantRequest = new TenantRequest()
    tenantRequest.name = input.name
    tenantRequest.ministryName = input.ministryName
    if (input.description !== undefined) {
      tenantRequest.description = input.description
    }
    tenantRequest.status = 'NEW'
    tenantRequest.requestedBy = await tmsRepository.setSSOUser(
      input.user.ssoUserId,
      input.user.firstName,
      input.user.lastName,
      input.user.displayName,
      input.user.userName || '',
      input.user.email || '',
      input.user.idpType,
    )
    tenantRequest.createdBy = input.user.ssoUserId
    tenantRequest.updatedBy = input.user.ssoUserId

    const savedTenantRequest = await manager.save(tenantRequest)
    const savedTenantRequestWithRelations = await this.getTenantRequestById(
      savedTenantRequest.id,
      manager,
    )
    if (!savedTenantRequestWithRelations) {
      throw new UnexpectedStateError('Tenant request creation failed')
    }
    if (savedTenantRequestWithRelations.requestedBy?.displayName) {
      savedTenantRequestWithRelations.createdBy =
        savedTenantRequestWithRelations.requestedBy.displayName
    }

    return savedTenantRequestWithRelations
  }

  public async updateTenantRequestStatus(
    input: UpdateTenantRequestStatusInputDto,
    manager: EntityManager,
  ) {
    const requestId = input.requestId
    const { status, rejectionReason, tenantName } = input
    const response: Partial<UpdateTenantRequestStatusResultDto> = {}

    const tenantRequest = await this.getTenantRequestById(requestId, manager)
    if (!tenantRequest) {
      throw new NotFoundError(`Tenant request not found: ${requestId}`)
    }

    if (tenantRequest.status !== 'NEW') {
      throw new ConflictError(
        `Cannot update tenant request with status: ${tenantRequest.status}`,
        TMSConstants.TENANT_REQUEST_INVALID_STATUS,
      )
    }

    if (status === 'REJECTED' && !rejectionReason) {
      throw new ConflictError(
        'Rejection reason is required when rejecting a tenant request',
      )
    }

    if (status === 'APPROVED') {
      if (tenantName) {
        tenantRequest.name = tenantName
      }
      if (
        await tmsRepository.checkIfTenantNameAndMinistryNameExists(
          tenantRequest.name,
          tenantRequest.ministryName,
        )
      ) {
        throw new ConflictError(
          `A tenant with name '${tenantRequest.name}' and ministry name '${tenantRequest.ministryName}' already exists`,
          TMSConstants.TENANT_NAME_ALREADY_EXISTS,
        )
      }

      const tenantRequestBody: CreateTenantInputDto = {
        name: tenantRequest.name,
        ministryName: tenantRequest.ministryName,
        description: tenantRequest.description,
        user: {
          ssoUserId: tenantRequest.requestedBy.ssoUserId,
          firstName: tenantRequest.requestedBy.firstName,
          lastName: tenantRequest.requestedBy.lastName,
          displayName: tenantRequest.requestedBy.displayName,
          userName: tenantRequest.requestedBy.userName,
          email: tenantRequest.requestedBy.email,
          idpType: tenantRequest.requestedBy.idpType as IdpType,
        },
      }
      const savedTenant = (await tmsRepository.saveTenant(
        tenantRequestBody,
        manager,
      )) as Tenant

      response.tenant = {
        id: savedTenant.id,
        name: savedTenant.name,
        ministryName: savedTenant.ministryName,
        description: savedTenant.description,
        createdBy: savedTenant.createdBy,
        updatedBy: savedTenant.updatedBy,
      }
    }

    let opsAdminSSOUser = await tmsRepository.setSSOUser(
      input.decisionedByUser.ssoUserId,
      input.decisionedByUser.firstName,
      input.decisionedByUser.lastName,
      input.decisionedByUser.displayName,
      input.decisionedByUser.userName,
      input.decisionedByUser.email,
      input.decisionedByUser.idpType,
    )

    opsAdminSSOUser = await manager.save(opsAdminSSOUser)

    tenantRequest.status = status
    tenantRequest.decisionedBy = opsAdminSSOUser
    tenantRequest.decisionedAt = new Date()
    const nextRejectionReason =
      status === 'REJECTED' ? rejectionReason || null : null
    tenantRequest.rejectionReason = nextRejectionReason as unknown as string
    tenantRequest.updatedBy = input.updatedBy

    const updatedRequest = await manager.save(tenantRequest)

    response.tenantRequest = { ...updatedRequest }

    if (!response.tenantRequest) {
      throw new UnexpectedStateError('Tenant request status update failed')
    }

    return response as UpdateTenantRequestStatusResultDto
  }

  public async getTenantRequestById(
    tenantRequestId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    return em
      .createQueryBuilder(TenantRequest, 'tenantRequest')
      .leftJoinAndSelect('tenantRequest.requestedBy', 'sso')
      .where('tenantRequest.id = :id', { id: tenantRequestId })
      .getOne()
  }

  public async getTenantRequests(
    input: GetTenantRequestsInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const { status, ssoUserId } = input
    const queryBuilder = em
      .createQueryBuilder(TenantRequest, 'tenantRequest')
      .leftJoinAndSelect('tenantRequest.requestedBy', 'requestedBy')
      .leftJoinAndSelect('tenantRequest.decisionedBy', 'decisionedBy')
      .orderBy('tenantRequest.requestedAt', 'DESC')

    if (status) {
      queryBuilder.where('tenantRequest.status = :status', { status })
    }

    if (ssoUserId) {
      queryBuilder.andWhere('requestedBy.ssoUserId = :ssoUserId', {
        ssoUserId,
      })
    }

    return await queryBuilder.getMany()
  }
}

export const tenantRequestRepository = new TenantRequestRepository()
