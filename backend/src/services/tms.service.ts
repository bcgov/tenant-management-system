import { Request } from 'express'
import { TMSRepository } from '../repositories/tms.repository'
import { TMRepository } from '../repositories/tm.repository'
import { connection } from '../common/db.connection'
import { URLSearchParams } from 'url'
import axios from 'axios'
import logger from '../common/logger'
import { TenantRequest } from '../entities/TenantRequest'
import { Tenant } from '../entities/Tenant'
import { BadRequestError } from '../errors/BadRequestError'
import { getErrorMessage } from '../common/error.handler'

const getRequiredEnv = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export class TMSService {
  tmsRepository: TMSRepository = new TMSRepository(connection.manager)
  tmRepository: TMRepository = new TMRepository(
    connection.manager,
    this.tmsRepository,
  )

  public async createTenant(req: Request) {
    const savedTenant: any = await this.tmsRepository.saveTenant(req)

    if (savedTenant?.users) {
      savedTenant.users = savedTenant.users.map((user: any) => ({
        ...user,
        roles: user.roles.map((tur: any) => tur.role),
      }))
    }

    return {
      data: {
        tenant: savedTenant,
      },
    }
  }

  public async addTenantUser(req: Request) {
    let response: any = {}
    await connection.manager.transaction(async (transactionEntityManager) => {
      try {
        const tmsResponse: any = await this.tmsRepository.addTenantUsers(
          req,
          transactionEntityManager,
        )
        const tenantUserId = tmsResponse.tenantUserId
        const savedUser: any = tmsResponse.savedTenantUser
        const roleAssignments: any = tmsResponse.roleAssignments || []
        const roles: any = roleAssignments.map(
          (assignment: any) => assignment.role,
        )

        const groupIds: string[] = req.body.groups || []
        const updatedBy: string = req.decodedJwt?.idir_user_guid || 'system'
        const tenantId: string = req.params.tenantId
        const groups: any = await this.tmRepository.addUserToGroups(
          tenantUserId,
          groupIds,
          tenantId,
          updatedBy,
          transactionEntityManager,
        )

        response = {
          data: {
            user: {
              ...savedUser,
              ssoUser: savedUser?.ssoUser,
              roles: roles,
              groups: groups,
            },
          },
        }
      } catch (error: unknown) {
        logger.error(
          'Add user to a tenant transaction failure - rolling back inserts ',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })
    return response
  }

  public async getTenantsForUser(req: Request) {
    const tenants = await this.tmsRepository.getTenantsForUser(req)

    const expand =
      typeof req.query.expand === 'string' ? req.query.expand.split(',') : []
    if (expand.includes('tenantUserRoles') && tenants) {
      const transformedTenants = tenants.map((tenant) => {
        if (tenant.users) {
          const transformedUsers = tenant.users.map((user) => {
            const userRoles = user.roles?.map((tur) => tur.role) || []
            return {
              ...user,
              roles: userRoles,
            }
          })
          return {
            ...tenant,
            users: transformedUsers,
          }
        }
        return tenant
      })
      return {
        data: {
          tenants: transformedTenants,
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

    const users = await this.tmsRepository.getUsersForTenant(
      req.params.tenantId,
      groupIds,
      sharedServiceRoleIds,
    )
    return {
      data: {
        users,
      },
    }
  }

  public async createRoles(req: Request) {
    const roles = await this.tmsRepository.createRoles(req)
    return {
      data: {
        role: roles,
      },
    }
  }

  public async assignUserRoles(req: Request) {
    const { tenantId, tenantUserId } = req.params
    const { roles } = req.body

    if (!Array.isArray(roles) || roles.length === 0) {
      throw new Error('roles must be a non-empty array')
    }

    const data = await this.tmsRepository.assignUserRoles(
      tenantId,
      tenantUserId,
      roles,
      null as any,
    )
    return {
      data: {
        roles: data.map((assignment) => assignment.role),
      },
    }
  }

  public async getTenantRoles(req: Request) {
    const roles = await this.tmsRepository.getTenantRoles(req)
    return {
      data: {
        roles,
      },
    }
  }

  public async getUserRoles(req: Request) {
    const roles = await this.tmsRepository.getUserRoles(req)
    return {
      data: {
        roles,
      },
    }
  }

  public async unassignUserRoles(req: Request) {
    await this.tmsRepository.unassignUserRoles(req)
  }

  public async searchBCGOVSSOUsers(req: Request) {
    try {
      const token: string = await this.getToken()
      const queryParams = req.query
      const response = await axios.get(getRequiredEnv('BCGOV_SSO_API_URL'), {
        headers: { Authorization: `Bearer ${token}` },
        params: queryParams,
      })
      return await response.data
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
      const queryParams = req.query
      const response = await axios.get(
        getRequiredEnv('BCGOV_SSO_API_URL_BCEID'),
        {
          headers: { Authorization: `Bearer ${token}` },
          params: queryParams,
        },
      )
      return await response.data
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
    const tenant = await this.tmsRepository.getTenant(req)

    const expand =
      typeof req.query.expand === 'string' ? req.query.expand.split(',') : []
    if (expand.includes('tenantUserRoles') && tenant?.users) {
      const transformedUsers = tenant.users.map((user) => {
        const userRoles = user.roles?.map((tur) => tur.role) || []
        return {
          ...user,
          roles: userRoles,
        }
      })
      ;(tenant as any).users = transformedUsers
    }

    return {
      data: {
        tenant,
      },
    }
  }

  public async updateTenant(req: Request) {
    const updatedTenant = await this.tmsRepository.updateTenant(req)

    return {
      data: {
        tenant: updatedTenant,
      },
    }
  }

  public async getRolesForSSOUser(req: Request) {
    const roles = await this.tmsRepository.getRolesForSSOUser(req)
    return {
      data: {
        roles,
      },
    }
  }

  public async createTenantRequest(req: Request) {
    const tenantRequest = (await this.tmsRepository.saveTenantRequest(
      req,
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
    const savedSharedService = await this.tmsRepository.saveSharedService(req)
    return {
      data: {
        sharedService: savedSharedService,
      },
    }
  }

  public async addSharedServiceRoles(req: Request) {
    const updatedSharedService =
      await this.tmsRepository.addSharedServiceRoles(req)
    return {
      data: {
        sharedService: updatedSharedService,
      },
    }
  }

  public async associateSharedServiceToTenant(req: Request) {
    await this.tmsRepository.associateSharedServiceToTenant(req)
  }

  public async getAllActiveSharedServices(_req: Request) {
    const sharedServices = await this.tmsRepository.getAllActiveSharedServices()
    return {
      data: {
        sharedServices,
      },
    }
  }

  public async getSharedServicesForTenant(req: Request) {
    const tenantId = req.params.tenantId
    const sharedServices =
      await this.tmsRepository.getSharedServicesForTenant(tenantId)
    return {
      data: {
        sharedServices,
      },
    }
  }

  public async removeTenantUser(req: Request) {
    const tenantId: string = req.params.tenantId
    const tenantUserId: string = req.params.tenantUserId
    const deletedBy: string = req.decodedJwt?.idir_user_guid || 'system'

    await connection.manager.transaction(async (transactionEntityManager) => {
      try {
        await this.tmsRepository.removeTenantUser(
          tenantUserId,
          tenantId,
          deletedBy,
          transactionEntityManager,
        )
        await this.tmRepository.removeUserFromAllGroups(
          tenantUserId,
          deletedBy,
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
        getRequiredEnv('BCGOV_TOKEN_URL'),
        new URLSearchParams({
          client_id: getRequiredEnv('BCGOV_SSO_API_CLIENT_ID'),
          client_secret: getRequiredEnv('BCGOV_SSO_API_CLIENT_SECRET'),
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
    const response = (await this.tmsRepository.updateTenantRequestStatus(
      req,
    )) as { tenantRequest: TenantRequest; tenant?: Tenant }
    const formattedResponse: { data: { tenantRequest: any; tenant?: Tenant } } =
      {
        data: {
          tenantRequest: {
            ...response.tenantRequest,
            requestedBy: response.tenantRequest.requestedBy?.displayName,
            decisionedBy: response.tenantRequest.decisionedBy?.displayName,
          },
        },
      }

    if (response.tenant) {
      formattedResponse.data.tenant = response.tenant
    }

    return formattedResponse
  }

  public async getTenantRequests(req: Request) {
    const status = req.query.status as string
    const tenantRequests = await this.tmsRepository.getTenantRequests(status)

    const formattedRequests = tenantRequests.map((request) => ({
      ...request,
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
    const tenantUser: any = await this.tmsRepository.getTenantUser(req)
    const expand: string[] =
      typeof req.query.expand === 'string'
        ? req.query.expand.split(',').map((v) => v.trim())
        : []

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
