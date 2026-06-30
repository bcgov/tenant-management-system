import { EntityManager } from 'typeorm'
import { SharedService } from '../entities/SharedService'
import { SharedServiceRole } from '../entities/SharedServiceRole'
import { TenantSharedService } from '../entities/TenantSharedService'
import { Tenant } from '../entities/Tenant'
import { ConflictError } from '../errors/ConflictError'
import { NotFoundError } from '../errors/NotFoundError'
import { UnexpectedStateError } from '../errors/UnexpectedStateError'
import logger from '../common/logger'
import { getErrorMessage } from '../common/error.handler'
import { connection } from '../common/db.connection'
import {
  AddSharedServiceRolesInputDto,
  AssociateSharedServiceToTenantInputDto,
  CreateSharedServiceInputDto,
  GetSharedServicesForTenantInputDto,
  SaveSharedServiceResultDto,
  UpdateSharedServiceInputDto,
  UpdateSharedServiceRoleInputDto,
  UpdateSharedServiceStatusInputDto,
} from '../dtos/tms.dto'

export class SharedServiceRepository {
  private get manager(): EntityManager {
    return connection.manager
  }

  public async saveSharedService(
    input: CreateSharedServiceInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? this.manager
    const {
      name,
      displayName,
      clientIdentifier,
      landingPageUrl,
      description,
      isActive,
      roles,
      updatedBy,
    } = input

    let sharedServiceResponse!: SaveSharedServiceResultDto

    await em.transaction(async (tx) => {
      try {
        if (await this.checkIfSharedServiceNameExists(name, tx)) {
          throw new ConflictError(
            `A shared service with name '${name}' already exists`,
          )
        }

        if (await this.checkIfSharedServiceDisplayNameExists(displayName, tx)) {
          throw new ConflictError(
            `A shared service with display name '${displayName}' already exists`,
          )
        }

        if (
          await this.checkIfSharedServiceClientIdentifierExists(
            clientIdentifier,
            tx,
          )
        ) {
          throw new ConflictError(
            `A shared service with client identifier '${clientIdentifier}' already exists`,
          )
        }

        const sharedService = new SharedService()
        sharedService.name = name
        sharedService.displayName = displayName
        sharedService.clientIdentifier = clientIdentifier
        sharedService.landingPageUrl = landingPageUrl
        if (description !== undefined) {
          sharedService.description = description
        }
        sharedService.isActive = isActive !== undefined ? isActive : true
        sharedService.createdBy = updatedBy
        sharedService.updatedBy = updatedBy

        const savedSharedService = await tx.save(sharedService)

        const sharedServiceRoles: SharedServiceRole[] = []
        for (const role of roles) {
          const sharedServiceRole = new SharedServiceRole()
          sharedServiceRole.name = role.name
          if (role.description !== undefined) {
            sharedServiceRole.description = role.description
          }
          sharedServiceRole.allowedIdentityProviders =
            role.allowedIdentityProviders &&
            role.allowedIdentityProviders.length > 0
              ? role.allowedIdentityProviders
              : null
          sharedServiceRole.sharedService = savedSharedService
          sharedServiceRole.createdBy = updatedBy
          sharedServiceRole.updatedBy = updatedBy
          sharedServiceRoles.push(sharedServiceRole)
        }
        await tx.save(sharedServiceRoles)

        const savedSharedServiceWithRoles = await this.getSharedServiceWithRoles(
          savedSharedService.id,
          tx,
        )
        if (!savedSharedServiceWithRoles) {
          throw new UnexpectedStateError(
            `Shared service load failed after update: ${savedSharedService.id}`,
          )
        }
        sharedServiceResponse = savedSharedServiceWithRoles
      } catch (error: unknown) {
        logger.error(
          'Create shared service transaction failure - rolling back inserts ',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })

    return sharedServiceResponse
  }

  public async updateSharedService(
    input: UpdateSharedServiceInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? this.manager
    const {
      sharedServiceId,
      name,
      displayName,
      clientIdentifier,
      landingPageUrl,
      description,
      updatedBy,
    } = input

    await em.transaction(async (tx) => {
      const sharedService = await tx
        .createQueryBuilder(SharedService, 'sharedService')
        .where('sharedService.id = :id', { id: sharedServiceId })
        .getOne()

      if (!sharedService) {
        throw new NotFoundError(`Shared service not found: ${sharedServiceId}`)
      }

      if (
        name !== undefined &&
        name !== sharedService.name &&
        (await tx
          .createQueryBuilder()
          .from(SharedService, 'ss')
          .where('ss.name = :name', { name })
          .andWhere('ss.id != :sharedServiceId', { sharedServiceId })
          .getExists())
      ) {
        throw new ConflictError(
          `A shared service with name '${name}' already exists`,
        )
      }

      if (
        displayName !== undefined &&
        displayName !== sharedService.displayName &&
        (await tx
          .createQueryBuilder()
          .from(SharedService, 'ss')
          .where('ss.displayName = :displayName', { displayName })
          .andWhere('ss.id != :sharedServiceId', { sharedServiceId })
          .getExists())
      ) {
        throw new ConflictError(
          `A shared service with display name '${displayName}' already exists`,
        )
      }

      if (
        clientIdentifier !== undefined &&
        clientIdentifier !== sharedService.clientIdentifier &&
        (await tx
          .createQueryBuilder()
          .from(SharedService, 'ss')
          .where('ss.clientIdentifier = :clientIdentifier', { clientIdentifier })
          .andWhere('ss.id != :sharedServiceId', { sharedServiceId })
          .getExists())
      ) {
        throw new ConflictError(
          `A shared service with client identifier '${clientIdentifier}' already exists`,
        )
      }

      if (name !== undefined) sharedService.name = name
      if (displayName !== undefined) sharedService.displayName = displayName
      if (clientIdentifier !== undefined)
        sharedService.clientIdentifier = clientIdentifier
      if (landingPageUrl !== undefined)
        sharedService.landingPageUrl = landingPageUrl
      if (description !== undefined) sharedService.description = description
      sharedService.updatedBy = updatedBy

      await tx.save(sharedService)
    })

    const updatedSharedService =
      await this.getSharedServiceWithRoles(sharedServiceId)
    if (!updatedSharedService) {
      throw new UnexpectedStateError(
        `Shared service load failed after update: ${sharedServiceId}`,
      )
    }

    return updatedSharedService
  }

  public async addSharedServiceRoles(
    input: AddSharedServiceRolesInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? this.manager
    const { sharedServiceId, roles, updatedBy } = input

    await em.transaction(async (tx) => {
      const sharedService = await tx
        .createQueryBuilder(SharedService, 'ss')
        .where('ss.id = :id', { id: sharedServiceId })
        .andWhere('ss.isActive = :isActive', { isActive: true })
        .getOne()

      if (!sharedService) {
        throw new NotFoundError(
          `Active shared service not found: ${sharedServiceId}`,
        )
      }

      for (const role of roles) {
        const existingRole = await tx
          .createQueryBuilder(SharedServiceRole, 'ssr')
          .where('ssr.name = :name', { name: role.name })
          .andWhere('ssr.sharedService.id = :sharedServiceId', {
            sharedServiceId,
          })
          .andWhere('ssr.isDeleted = :isDeleted', { isDeleted: false })
          .getOne()

        if (existingRole) {
          throw new ConflictError(
            `A role with name '${role.name}' already exists for this shared service`,
          )
        }
      }

      const sharedServiceRoles: SharedServiceRole[] = []
      for (const role of roles) {
        const sharedServiceRole = new SharedServiceRole()
        sharedServiceRole.name = role.name
        if (role.description !== undefined) {
          sharedServiceRole.description = role.description
        }
        sharedServiceRole.allowedIdentityProviders =
          role.allowedIdentityProviders &&
          role.allowedIdentityProviders.length > 0
            ? role.allowedIdentityProviders
            : null
        sharedServiceRole.sharedService = sharedService
        sharedServiceRole.isDeleted = false
        sharedServiceRole.createdBy = updatedBy
        sharedServiceRole.updatedBy = updatedBy
        sharedServiceRoles.push(sharedServiceRole)
      }

      await tx.save(sharedServiceRoles)
    })

    return await this.getSharedServiceWithRoles(sharedServiceId)
  }

  public async updateSharedServiceRole(
    input: UpdateSharedServiceRoleInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? this.manager
    const {
      sharedServiceId,
      sharedServiceRoleId,
      name,
      description,
      allowedIdentityProviders,
      updatedBy,
    } = input

    await em.transaction(async (tx) => {
      const sharedServiceRole = await tx
        .createQueryBuilder(SharedServiceRole, 'ssr')
        .innerJoinAndSelect('ssr.sharedService', 'sharedService')
        .where('ssr.id = :sharedServiceRoleId', { sharedServiceRoleId })
        .andWhere('sharedService.id = :sharedServiceId', { sharedServiceId })
        .andWhere('ssr.isDeleted = :isDeleted', { isDeleted: false })
        .getOne()

      if (!sharedServiceRole) {
        throw new NotFoundError(
          `Shared service role not found: ${sharedServiceRoleId}`,
        )
      }

      if (
        name !== undefined &&
        name !== sharedServiceRole.name &&
        (await tx
          .createQueryBuilder(SharedServiceRole, 'ssr')
          .where('ssr.name = :name', { name })
          .andWhere('ssr.sharedService.id = :sharedServiceId', { sharedServiceId })
          .andWhere('ssr.isDeleted = :isDeleted', { isDeleted: false })
          .andWhere('ssr.id != :sharedServiceRoleId', { sharedServiceRoleId })
          .getExists())
      ) {
        throw new ConflictError(
          `A role with name '${name}' already exists for this shared service`,
        )
      }

      if (name !== undefined) sharedServiceRole.name = name
      if (description !== undefined) sharedServiceRole.description = description
      if (allowedIdentityProviders !== undefined) {
        sharedServiceRole.allowedIdentityProviders =
          allowedIdentityProviders && allowedIdentityProviders.length > 0
            ? allowedIdentityProviders
            : null
      }
      sharedServiceRole.updatedBy = updatedBy

      await tx.save(sharedServiceRole)
    })

    const updatedSharedService =
      await this.getSharedServiceWithRoles(sharedServiceId)
    if (!updatedSharedService) {
      throw new UnexpectedStateError(
        `Shared service load failed after update: ${sharedServiceId}`,
      )
    }

    return updatedSharedService
  }

  public async updateSharedServiceStatus(
    input: UpdateSharedServiceStatusInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? this.manager
    const { sharedServiceId, isActive, updatedBy } = input

    await em.transaction(async (tx) => {
      const sharedService = await tx
        .createQueryBuilder(SharedService, 'sharedService')
        .where('sharedService.id = :id', { id: sharedServiceId })
        .getOne()

      if (!sharedService) {
        throw new NotFoundError(`Shared service not found: ${sharedServiceId}`)
      }

      if (sharedService.isActive === isActive) {
        throw new ConflictError(
          isActive
            ? 'Shared service is already active'
            : 'Shared service is already inactive',
        )
      }

      sharedService.isActive = isActive
      sharedService.updatedBy = updatedBy

      await tx.save(sharedService)
    })

    const updatedSharedService =
      await this.getSharedServiceWithRoles(sharedServiceId)
    if (!updatedSharedService) {
      throw new UnexpectedStateError(
        `Shared service load failed after update: ${sharedServiceId}`,
      )
    }

    return updatedSharedService
  }

  public async associateSharedServiceToTenant(
    input: AssociateSharedServiceToTenantInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? this.manager
    const { tenantId, sharedServiceId, updatedBy } = input

    await em.transaction(async (tx) => {
      try {
        const sharedService = await tx
          .createQueryBuilder(SharedService, 'sharedService')
          .where('sharedService.id = :id', { id: sharedServiceId })
          .getOne()

        if (!sharedService) {
          throw new NotFoundError(
            `Shared service not found: ${sharedServiceId}`,
          )
        }

        if (!sharedService.isActive) {
          throw new ConflictError(
            `Cannot associate inactive shared service '${sharedService.name}' to tenant`,
          )
        }

        const existingAssociation = await tx
          .createQueryBuilder(TenantSharedService, 'tss')
          .where('tss.tenant.id = :tenantId', { tenantId })
          .andWhere('tss.sharedService.id = :sharedServiceId', { sharedServiceId })
          .andWhere('tss.isDeleted = :isDeleted', { isDeleted: false })
          .getOne()

        if (existingAssociation) {
          throw new ConflictError(
            `Shared service '${sharedService.name}' is already associated with this tenant`,
          )
        }

        const tenant = await tx
          .createQueryBuilder(Tenant, 'tenant')
          .where('tenant.id = :id', { id: tenantId })
          .getOne()

        if (!tenant) {
          throw new NotFoundError(`Tenant not found: ${tenantId}`)
        }

        const tenantSharedService = new TenantSharedService()
        tenantSharedService.tenant = tenant
        tenantSharedService.sharedService = sharedService
        tenantSharedService.isDeleted = false
        tenantSharedService.createdBy = updatedBy
        tenantSharedService.updatedBy = updatedBy

        await tx.save(tenantSharedService)
      } catch (error: unknown) {
        logger.error(
          'Associate shared service to tenant transaction failure - rolling back inserts',
          { error: getErrorMessage(error) },
        )
        throw error
      }
    })
  }

  public async getAllActiveSharedServices(manager?: EntityManager) {
    const em = manager ?? this.manager
    return em
      .createQueryBuilder(SharedService, 'sharedService')
      .leftJoinAndSelect('sharedService.roles', 'roles')
      .where('sharedService.isActive = :isActive', { isActive: true })
      .andWhere('roles.isDeleted = :isDeleted', { isDeleted: false })
      .orderBy('sharedService.name', 'ASC')
      .getMany()
  }

  public async getSharedServicesForTenant(
    input: GetSharedServicesForTenantInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? this.manager
    const { tenantId } = input
    const tenantSharedServices = await em
      .createQueryBuilder(TenantSharedService, 'tss')
      .leftJoinAndSelect('tss.sharedService', 'sharedService')
      .leftJoinAndSelect('sharedService.roles', 'roles')
      .where('tss.tenant.id = :tenantId', { tenantId })
      .andWhere('tss.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('roles.isDeleted = :rolesDeleted', { rolesDeleted: false })
      .orderBy('sharedService.name', 'ASC')
      .getMany()

    return tenantSharedServices.map((tss) => tss.sharedService)
  }

  public async getSharedServiceWithRoles(
    sharedServiceId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? this.manager
    return em
      .createQueryBuilder(SharedService, 'sharedService')
      .leftJoinAndSelect('sharedService.roles', 'roles')
      .where('sharedService.id = :id', { id: sharedServiceId })
      .andWhere('roles.isDeleted = :isDeleted', { isDeleted: false })
      .getOne()
  }

  public async checkIfSharedServiceNameExists(
    name: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? this.manager
    return em
      .createQueryBuilder()
      .from(SharedService, 'ss')
      .where('ss.name = :name', { name })
      .getExists()
  }

  public async checkIfSharedServiceDisplayNameExists(
    displayName: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? this.manager
    return em
      .createQueryBuilder()
      .from(SharedService, 'ss')
      .where('ss.displayName = :displayName', { displayName })
      .getExists()
  }

  public async checkIfSharedServiceClientIdentifierExists(
    clientIdentifier: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? this.manager
    return em
      .createQueryBuilder()
      .from(SharedService, 'ss')
      .where('ss.clientIdentifier = :clientIdentifier', { clientIdentifier })
      .getExists()
  }

  public async checkIfTenantHasSharedServiceAccess(
    tenantId: string,
    clientIdentifier: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? this.manager
    return em
      .createQueryBuilder()
      .from(TenantSharedService, 'tss')
      .innerJoin('tss.sharedService', 'ss')
      .where('tss.tenant.id = :tenantId', { tenantId })
      .andWhere('ss.clientIdentifier = :clientIdentifier', { clientIdentifier })
      .andWhere('ss.isActive = :isActive', { isActive: true })
      .andWhere('tss.isDeleted = :isDeleted', { isDeleted: false })
      .getExists()
  }
}

export const sharedServiceRepository = new SharedServiceRepository()
