import { Request } from 'express'
import { TMSRepository } from '../repositories/tms.repository'
import { TMRepository } from '../repositories/tm.repository'
import { connection } from '../common/db.connection'
import { URLSearchParams } from 'url'
import axios from 'axios'
import logger from '../common/logger'
import { TenantRequest } from '../entities/TenantRequest'
import { Tenant } from '../entities/Tenant'
import { Group } from '../entities/Group'
import { BadRequestError } from '../errors/BadRequestError'
import { getErrorMessage } from '../common/error.handler'
import { AddTenantUserResponseDto, TMSMapper } from '../mappers/tms.mapper'
import {
  AssociateSharedServiceToTenantInputDto,
  AssignUserRolesInputDto,
  AddTenantUserInputDto,
  AddTenantUserResultDto,
  AddSharedServiceRolesInputDto,
  CreateTenantRolesInputDto,
  CreateTenantInputDto,
  CreateTenantRequestInputDto,
  CreateSharedServiceInputDto,
  UpdateSharedServiceStatusInputDto,
  UpdateTenantRequestStatusResponseDto,
  UpdateTenantRequestStatusResultDto,
  UpdateTenantRequestStatusInputDto,
  GetRolesForSsoUserInputDto,
  GetSharedServicesForTenantInputDto,
  GetTenantInputDto,
  GetTenantUserInputDto,
  GetTenantUserResultDto,
  GetTenantRequestsInputDto,
  GetTenantUsersInputDto,
  GetTenantRolesInputDto,
  GetUserRolesInputDto,
  GetUserTenantsInputDto,
  RemoveTenantUserInputDto,
  UpdateTenantInputDto,
  UnassignUserRolesInputDto,
} from '../dtos/tms.dto'
import { config } from '../services/config.service'

export class TMSService {
  tmsRepository: TMSRepository
  tmRepository: TMRepository
  mapper: TMSMapper

  constructor(
    tmsRepository?: TMSRepository,
    tmRepository?: TMRepository,
    mapper?: TMSMapper,
  ) {
    this.tmsRepository = tmsRepository || new TMSRepository(connection.manager)
    this.tmRepository =
      tmRepository || new TMRepository(connection.manager, this.tmsRepository)
    this.mapper = mapper || new TMSMapper()
  }

  private getIdirGuid(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') {
      return undefined
    }

    const attributes = (user as { attributes?: unknown }).attributes
    if (!attributes || typeof attributes !== 'object') {
      return undefined
    }

    const idirUserGuid = (attributes as { idir_user_guid?: unknown })
      .idir_user_guid
    if (!Array.isArray(idirUserGuid) || typeof idirUserGuid[0] !== 'string') {
      return undefined
    }

    return idirUserGuid[0]
  }

  private getIdirUserCompletenessScore(user: unknown): number {
    if (!user || typeof user !== 'object') {
      return 0
    }

    const typedUser = user as {
      firstName?: unknown
      lastName?: unknown
      email?: unknown
      username?: unknown
      attributes?: {
        display_name?: unknown
        idir_username?: unknown
      }
    }

    let score = 0

    if (typeof typedUser.firstName === 'string' && typedUser.firstName.trim()) {
      score += 1
    }
    if (typeof typedUser.lastName === 'string' && typedUser.lastName.trim()) {
      score += 1
    }
    if (typeof typedUser.email === 'string' && typedUser.email.trim()) {
      score += 1
    }
    if (typeof typedUser.username === 'string' && typedUser.username.trim()) {
      score += 1
    }
    if (
      Array.isArray(typedUser.attributes?.display_name) &&
      typeof typedUser.attributes.display_name[0] === 'string' &&
      typedUser.attributes.display_name[0].trim()
    ) {
      score += 1
    }
    if (
      Array.isArray(typedUser.attributes?.idir_username) &&
      typeof typedUser.attributes.idir_username[0] === 'string' &&
      typedUser.attributes.idir_username[0].trim()
    ) {
      score += 1
    }
    if (this.getIdirGuid(user)) {
      score += 1
    }

    return score
  }

  private dedupIdirSearchResults(payload: unknown) {
    if (!payload || typeof payload !== 'object') {
      return payload
    }

    const data = (payload as { data?: unknown }).data
    if (!Array.isArray(data)) {
      return payload
    }

    const dedupedUsers = new Map<
      string,
      { user: unknown; score: number; firstSeenIndex: number }
    >()
    const usersWithoutGuid: Array<{ user: unknown; index: number }> = []

    data.forEach((user, index) => {
      const guid = this.getIdirGuid(user)

      if (!guid) {
        usersWithoutGuid.push({ user, index })
        return
      }

      const score = this.getIdirUserCompletenessScore(user)
      const existing = dedupedUsers.get(guid)

      if (!existing || score > existing.score) {
        dedupedUsers.set(guid, {
          user,
          score,
          firstSeenIndex: existing?.firstSeenIndex ?? index,
        })
      }
    })

    const dedupedData = [
      ...Array.from(dedupedUsers.values()).map((entry) => ({
        user: entry.user,
        index: entry.firstSeenIndex,
      })),
      ...usersWithoutGuid,
    ]
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.user)

    return {
      ...(payload as Record<string, unknown>),
      data: dedupedData,
    }
  }

  private getBceidGuid(user: unknown): string | undefined {
    if (!user || typeof user !== 'object') {
      return undefined
    }

    const attributes = (user as { attributes?: unknown }).attributes
    if (!attributes || typeof attributes !== 'object') {
      return undefined
    }

    const bceidUserGuid = (attributes as { bceid_user_guid?: unknown })
      .bceid_user_guid
    if (!Array.isArray(bceidUserGuid) || typeof bceidUserGuid[0] !== 'string') {
      return undefined
    }

    return bceidUserGuid[0]
  }

  private getBceidUserCompletenessScore(user: unknown): number {
    if (!user || typeof user !== 'object') {
      return 0
    }

    const typedUser = user as {
      firstName?: unknown
      lastName?: unknown
      email?: unknown
      username?: unknown
      attributes?: {
        display_name?: unknown
        bceid_username?: unknown
      }
    }

    let score = 0

    if (typeof typedUser.firstName === 'string' && typedUser.firstName.trim()) {
      score += 1
    }
    if (typeof typedUser.lastName === 'string' && typedUser.lastName.trim()) {
      score += 1
    }
    if (typeof typedUser.email === 'string' && typedUser.email.trim()) {
      score += 1
    }
    if (typeof typedUser.username === 'string' && typedUser.username.trim()) {
      score += 1
    }
    if (
      Array.isArray(typedUser.attributes?.display_name) &&
      typeof typedUser.attributes.display_name[0] === 'string' &&
      typedUser.attributes.display_name[0].trim()
    ) {
      score += 1
    }
    if (
      Array.isArray(typedUser.attributes?.bceid_username) &&
      typeof typedUser.attributes.bceid_username[0] === 'string' &&
      typedUser.attributes.bceid_username[0].trim()
    ) {
      score += 1
    }
    if (this.getBceidGuid(user)) {
      score += 1
    }

    return score
  }

  private dedupBceidSearchResults(payload: unknown) {
    if (!payload || typeof payload !== 'object') {
      return payload
    }

    const data = (payload as { data?: unknown }).data
    if (!Array.isArray(data)) {
      return payload
    }

    const dedupedUsers = new Map<
      string,
      { user: unknown; score: number; firstSeenIndex: number }
    >()
    const usersWithoutGuid: Array<{ user: unknown; index: number }> = []

    data.forEach((user, index) => {
      const guid = this.getBceidGuid(user)

      if (!guid) {
        usersWithoutGuid.push({ user, index })
        return
      }

      const score = this.getBceidUserCompletenessScore(user)
      const existing = dedupedUsers.get(guid)

      if (!existing || score > existing.score) {
        dedupedUsers.set(guid, {
          user,
          score,
          firstSeenIndex: existing?.firstSeenIndex ?? index,
        })
      }
    })

    const dedupedData = [
      ...Array.from(dedupedUsers.values()).map((entry) => ({
        user: entry.user,
        index: entry.firstSeenIndex,
      })),
      ...usersWithoutGuid,
    ]
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.user)

    return {
      ...(payload as Record<string, unknown>),
      data: dedupedData,
    }
  }

  public async createTenant(req: Request) {
    const input: CreateTenantInputDto = {
      name: req.body.name,
      ministryName: req.body.ministryName,
      description: req.body.description,
      user: req.body.user,
    }
    const savedTenant: Tenant = await this.tmsRepository.saveTenant(input)
    const tenantDto = this.mapper.toTenantDto(savedTenant)

    return {
      data: {
        tenant: tenantDto,
      },
    }
  }

  public async addTenantUser(req: Request) {
    let response: AddTenantUserResponseDto | undefined
    const input: AddTenantUserInputDto = {
      tenantId: req.params.tenantId,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
      user: req.body.user,
      roles: req.body.roles,
      groups: req.body.groups,
    }

    await connection.manager.transaction(async (transactionEntityManager) => {
      try {
        const tmsResponse: AddTenantUserResultDto =
          await this.tmsRepository.addTenantUsers(
            input,
            transactionEntityManager,
          )
        const groupIds: string[] = input.groups || []
        const groups: Group[] = await this.tmRepository.addUserToGroups(
          tmsResponse.tenantUserId,
          groupIds,
          input.tenantId,
          input.updatedBy,
          transactionEntityManager,
        )
        response = this.mapper.toAddTenantUserResponseDto(
          tmsResponse.savedTenantUser,
          tmsResponse.roleAssignments,
          groups,
        )
      } catch (error: unknown) {
        logger.error(
          'Add user to a tenant transaction failure - rolling back inserts ',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })
    if (!response) {
      throw new Error('Failed to create add tenant user response')
    }
    return response
  }

  public async getTenantsForUser(req: Request) {
    const expand =
      typeof req.query.expand === 'string' ? req.query.expand.split(',') : []
    const input: GetUserTenantsInputDto = {
      ssoUserId: req.params.ssoUserId,
      expand,
      jwtAudience:
        req.decodedJwt?.aud ||
        req.decodedJwt?.audience ||
        config.oidc.tmsAudience,
    }
    const tenants = await this.tmsRepository.getTenantsForUser(input)

    if (expand.includes('tenantUserRoles') && tenants) {
      return {
        data: {
          tenants: this.mapper.toTenantDtos(tenants),
        },
      }
    }

    return {
      data: {
        tenants,
      },
    }
  }

  public async getUsersForTenant(req: Request) {
    const groupIds =
      typeof req.query.groupIds === 'string'
        ? req.query.groupIds
            .split(',')
            .map((id) => id.trim())
            .filter((id) => id.length > 0)
        : undefined
    const sharedServiceRoleIds =
      typeof req.query.sharedServiceRoleIds === 'string'
        ? req.query.sharedServiceRoleIds
            .split(',')
            .map((id) => id.trim())
            .filter((id) => id.length > 0)
        : undefined

    const input: GetTenantUsersInputDto = {
      tenantId: req.params.tenantId,
      groupIds,
      sharedServiceRoleIds,
    }
    const users = await this.tmsRepository.getUsersForTenant(input)
    return {
      data: {
        users,
      },
    }
  }

  public async createRoles(req: Request) {
    const input: CreateTenantRolesInputDto = {
      tenantId: req.params.tenantId,
      role: req.body.role,
    }
    const roles = await this.tmsRepository.createRoles(input)
    return {
      data: {
        role: roles,
      },
    }
  }

  public async assignUserRoles(req: Request) {
    const { tenantId, tenantUserId } = req.params
    const { roles } = req.body

    const input: AssignUserRolesInputDto = {
      tenantId,
      tenantUserId,
      roleIds: roles,
    }
    const data = await this.tmsRepository.assignUserRolesForUser(input)
    return {
      data: {
        roles: data.map((assignment) => assignment.role),
      },
    }
  }

  public async getTenantRoles(req: Request) {
    const input: GetTenantRolesInputDto = {
      tenantId: req.params.tenantId,
    }
    const roles = await this.tmsRepository.getTenantRoles(input)
    return {
      data: {
        roles,
      },
    }
  }

  public async getUserRoles(req: Request) {
    const input: GetUserRolesInputDto = {
      tenantId: req.params.tenantId,
      tenantUserId: req.params.tenantUserId,
    }
    const roles = await this.tmsRepository.getUserRoles(input)
    return {
      data: {
        roles,
      },
    }
  }

  public async unassignUserRoles(req: Request) {
    const input: UnassignUserRolesInputDto = {
      tenantId: req.params.tenantId,
      tenantUserId: req.params.tenantUserId,
      roleId: req.params.roleId,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    await this.tmsRepository.unassignUserRoles(input)
  }

  public async searchBCGOVSSOUsers(req: Request) {
    try {
      const token: string = await this.getToken()
      const { dedup, ...queryParams } = req.query
      const response = await axios.get(config.bcgovSsoApi.url, {
        headers: { Authorization: `Bearer ${token}` },
        params: queryParams,
      })

      const dedupValue = dedup as unknown
      const shouldDedup =
        dedupValue === true ||
        (typeof dedupValue === 'string' && dedupValue === 'true')

      if (!shouldDedup) {
        return response.data
      }

      return this.dedupIdirSearchResults(response.data)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (
          error as {
            response?: { status?: number; data?: { message?: string } }
          }
        ).response?.status === 'number'
      ) {
        const axiosError = error as {
          response: { status: number; data?: { message?: string } }
        }
        if (axiosError.response.status === 400) {
          throw new BadRequestError(
            `BC GOV SSO API returned bad request: ${axiosError.response.data?.message || getErrorMessage(error)}`,
          )
        }
      }
      throw new Error(
        'Error invoking BC GOV SSO API. ' + getErrorMessage(error),
      )
    }
  }

  public async searchBCGOVSSOBceidUsers(req: Request) {
    try {
      const token: string = await this.getToken()
      const { dedup, ...queryParams } = req.query
      const response = await axios.get(config.bcgovSsoApi.urlBceid, {
        headers: { Authorization: `Bearer ${token}` },
        params: queryParams,
      })
      const dedupValue = dedup as unknown
      const shouldDedup =
        dedupValue === true ||
        (typeof dedupValue === 'string' && dedupValue === 'true')

      if (!shouldDedup) {
        return response.data
      }

      return this.dedupBceidSearchResults(response.data)
    } catch (error: unknown) {
      logger.error(getErrorMessage(error))
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        typeof (
          error as {
            response?: { status?: number; data?: { message?: string } }
          }
        ).response?.status === 'number'
      ) {
        const axiosError = error as {
          response: { status: number; data?: { message?: string } }
        }
        if (axiosError.response.status === 400) {
          throw new BadRequestError(
            `BC GOV SSO BCEID API returned bad request: ${axiosError.response.data?.message || getErrorMessage(error)}`,
          )
        }
      }
      throw new Error(
        'Error invoking BC GOV SSO BCEID API. ' + getErrorMessage(error),
      )
    }
  }

  public async getTenant(req: Request) {
    const expand =
      typeof req.query.expand === 'string' ? req.query.expand.split(',') : []
    const input: GetTenantInputDto = {
      tenantId: req.params.tenantId,
      expand,
    }
    const tenant = await this.tmsRepository.getTenant(input)

    if (expand.includes('tenantUserRoles') && tenant?.users) {
      const tenantDto = this.mapper.toTenantDto(tenant as Tenant)
      return {
        data: {
          tenant: tenantDto,
        },
      }
    }

    return {
      data: {
        tenant,
      },
    }
  }

  public async updateTenant(req: Request) {
    const input: UpdateTenantInputDto = {
      tenantId: req.params.tenantId,
      name: req.body.name,
      ministryName: req.body.ministryName,
      description: req.body.description,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    const updatedTenant = await this.tmsRepository.updateTenant(input)

    return {
      data: {
        tenant: updatedTenant,
      },
    }
  }

  public async getRolesForSSOUser(req: Request) {
    const input: GetRolesForSsoUserInputDto = {
      tenantId: req.params.tenantId,
      ssoUserId: req.params.ssoUserId,
    }
    const roles = await this.tmsRepository.getRolesForSSOUser(input)
    return {
      data: {
        roles,
      },
    }
  }

  public async createTenantRequest(req: Request) {
    const input: CreateTenantRequestInputDto = {
      name: req.body.name,
      ministryName: req.body.ministryName,
      description: req.body.description,
      user: req.body.user,
    }
    const tenantRequest = (await this.tmsRepository.saveTenantRequest(
      input,
    )) as TenantRequest
    return {
      data: {
        tenantRequest: {
          ...tenantRequest,
          requestedBy: tenantRequest.requestedBy?.displayName,
        },
      },
    }
  }

  public async createSharedService(req: Request) {
    const input: CreateSharedServiceInputDto = {
      name: req.body.name,
      displayName: req.body.displayName,
      clientIdentifier: req.body.clientIdentifier,
      landingPageUrl: req.body.landingPageUrl,
      description: req.body.description,
      isActive: req.body.isActive,
      roles: req.body.roles,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    const savedSharedService = await this.tmsRepository.saveSharedService(input)
    return {
      data: {
        sharedService: savedSharedService,
      },
    }
  }

  public async addSharedServiceRoles(req: Request) {
    const input: AddSharedServiceRolesInputDto = {
      sharedServiceId: req.params.sharedServiceId,
      roles: req.body.roles,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    const updatedSharedService =
      await this.tmsRepository.addSharedServiceRoles(input)
    return {
      data: {
        sharedService: updatedSharedService,
      },
    }
  }

  public async updateSharedServiceStatus(req: Request) {
    const input: UpdateSharedServiceStatusInputDto = {
      sharedServiceId: req.params.sharedServiceId,
      isActive: req.body.isActive,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    const updatedSharedService =
      await this.tmsRepository.updateSharedServiceStatus(input)
    return {
      data: {
        sharedService: updatedSharedService,
      },
    }
  }

  public async associateSharedServiceToTenant(req: Request) {
    const input: AssociateSharedServiceToTenantInputDto = {
      tenantId: req.params.tenantId,
      sharedServiceId: req.body.sharedServiceId,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
    }
    await this.tmsRepository.associateSharedServiceToTenant(input)
  }

  public async getAllActiveSharedServices() {
    const sharedServices = await this.tmsRepository.getAllActiveSharedServices()
    return {
      data: {
        sharedServices,
      },
    }
  }

  public async getSharedServicesForTenant(req: Request) {
    const input: GetSharedServicesForTenantInputDto = {
      tenantId: req.params.tenantId,
    }
    const sharedServices =
      await this.tmsRepository.getSharedServicesForTenant(input)
    return {
      data: {
        sharedServices,
      },
    }
  }

  public async removeTenantUser(req: Request) {
    const input: RemoveTenantUserInputDto = {
      tenantId: req.params.tenantId,
      tenantUserId: req.params.tenantUserId,
      deletedBy: req.decodedJwt?.idir_user_guid || 'system',
    }

    await connection.manager.transaction(async (transactionEntityManager) => {
      try {
        await this.tmsRepository.removeTenantUser(
          input,
          transactionEntityManager,
        )
        await this.tmRepository.removeUserFromAllGroups(
          input.tenantUserId,
          input.deletedBy,
          transactionEntityManager,
        )
      } catch (error: unknown) {
        logger.error(
          'Remove tenant user transaction failure - rolling back changes',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })
  }

  private async getToken() {
    try {
      const response = await axios.post(
        config.bcgovSsoApi.tokenUrl,
        new URLSearchParams({
          client_id: config.bcgovSsoApi.clientId,
          client_secret: config.bcgovSsoApi.clientSecret,
          grant_type: 'client_credentials',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      )
      return response.data.access_token
    } catch (error: unknown) {
      throw new Error(
        'Failed to obtain access token: ' + getErrorMessage(error),
      )
    }
  }

  public async updateTenantRequestStatus(req: Request) {
    const input: UpdateTenantRequestStatusInputDto = {
      requestId: req.params.requestId,
      status: req.body.status,
      rejectionReason: req.body.rejectionReason,
      tenantName: req.body.tenantName,
      updatedBy: req.decodedJwt?.idir_user_guid || 'system',
      decisionedByUser: {
        ssoUserId: req.decodedJwt?.idir_user_guid || 'system',
        firstName: req.decodedJwt?.given_name || 'System',
        lastName: req.decodedJwt?.family_name || 'User',
        displayName: req.decodedJwt?.display_name || 'System User',
        userName: req.decodedJwt?.preferred_username || 'system',
        email: req.decodedJwt?.email || 'system@gov.bc.ca',
      },
    }
    const response: UpdateTenantRequestStatusResultDto =
      await this.tmsRepository.updateTenantRequestStatus(input)
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
    const tenantRequests = await this.tmsRepository.getTenantRequests(input)

    const formattedRequests = tenantRequests.map((request) => ({
      ...request,
      createdBy: request.requestedBy?.displayName || 'system',
      requestedBy: request.requestedBy?.displayName,
      decisionedBy: request.decisionedBy?.displayName,
    }))

    return {
      data: {
        tenantRequests: formattedRequests,
      },
    }
  }

  public async getTenantUser(req: Request) {
    const expand: string[] =
      typeof req.query.expand === 'string'
        ? req.query.expand.split(',').map((v) => v.trim())
        : []
    const input: GetTenantUserInputDto = {
      tenantId: req.params.tenantId,
      tenantUserId: req.params.tenantUserId,
      expand,
    }
    const tenantUser: GetTenantUserResultDto =
      await this.tmsRepository.getTenantUser(input)

    if (expand.includes('groups')) {
      tenantUser.groups = await this.tmRepository.getTenantUserGroups(
        tenantUser.id,
      )
    }

    if (expand.includes('sharedServices')) {
      tenantUser.sharedServices =
        await this.tmRepository.getTenantUserSharedServiceRoles(tenantUser.id)
    }

    return {
      data: {
        tenantUser: tenantUser,
      },
    }
  }
}
