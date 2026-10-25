import { Request } from 'express'
import { tenantRepository } from '../repositories/tenant.repository'
import { groupRepository } from '../repositories/group.repository'
import { NotFoundError } from '../errors/NotFoundError'

const SERVICE_ACCOUNT_PREFIX = 'service-account-'

export class PocService {
  private isServiceAccount(userId: string): boolean {
    return userId.startsWith(SERVICE_ACCOUNT_PREFIX)
  }

  private async getIdpType(tenantId: string, userId: string): Promise<string> {
    const tenantUser = await tenantRepository.getTenantUserBySsoId(
      userId,
      tenantId,
    )

    if (!tenantUser) {
      throw new NotFoundError(`Tenant user not found: ${userId}`)
    }

    return tenantUser.ssoUser.idpType
  }

  public async getTenants(req: Request) {
    const userId = req.query.userId as string
    const serviceId = req.query.serviceId as string | undefined

    if (this.isServiceAccount(userId)) {
      return { data: { tenants: [] } }
    }

    const tenants = await tenantRepository.getTenantsForUser({
      ssoUserId: userId,
      expand: [],
      jwtAudience: serviceId,
    })

    return {
      data: {
        tenants: tenants.map((tenant) => ({
          id: tenant.id,
          name: tenant.name,
          ministryName: tenant.ministryName,
        })),
      },
    }
  }

  public async getRoles(req: Request) {
    const tenantId = req.query.tenantId as string
    const userId = req.query.userId as string
    const serviceId = req.query.serviceId as string

    if (this.isServiceAccount(userId)) {
      return { data: { roles: [] } }
    }

    const idpType = await this.getIdpType(tenantId, userId)
    const roles = await groupRepository.getEffectiveSharedServiceRoles({
      tenantId,
      ssoUserId: userId,
      audience: serviceId,
      idpType,
    })

    return {
      data: {
        roles: roles.map((role) => role.name),
      },
    }
  }

  public async getGroups(req: Request) {
    const tenantId = req.query.tenantId as string
    const userId = req.query.userId as string
    const serviceId = req.query.serviceId as string

    if (this.isServiceAccount(userId)) {
      return { data: { groups: [] } }
    }

    const idpType = await this.getIdpType(tenantId, userId)
    const { groups } =
      await groupRepository.getUserGroupsWithSharedServiceRoles({
        tenantId,
        ssoUserId: userId,
        audience: serviceId,
        idpType,
      })

    return {
      data: {
        groups: groups.map((group) => ({
          id: group.id,
          name: group.name,
          roles: group.sharedServiceRoles.map((role) => role.name),
        })),
      },
    }
  }
}

export const pocService = new PocService()
