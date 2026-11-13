import { EntityManager } from 'typeorm'
import { SharedService } from '../entities/SharedService'
import { SharedServiceRole } from '../entities/SharedServiceRole'
import { TenantSharedService } from '../entities/TenantSharedService'
import { Tenant } from '../entities/Tenant'
import { BadRequestError } from '../errors/BadRequestError'
import { ConflictError } from '../errors/ConflictError'
import { NotFoundError } from '../errors/NotFoundError'
import { UnexpectedStateError } from '../errors/UnexpectedStateError'
import { getManager } from '../common/db.connection'
import { config } from '../services/config.service'
import {
  AddSharedServiceRolesInputDto,
  AssociateSharedServiceToTenantInputDto,
  CreateSharedServiceInputDto,
  GetSharedServicesForTenantInputDto,
  UpdateSharedServiceInputDto,
  UpdateSharedServiceRoleInputDto,
  UpdateSharedServiceStatusInputDto,
} from '../dtos/tms.dto'

type UpdatableSharedServiceField =
  | 'name'
  | 'displayName'
  | 'clientIdentifier'
  | 'landingPageUrl'
  | 'description'
  | 'allowHeadlessOps'
  | 'allowServiceAccounts'
  | 'serviceAccountClientIdentifier'

const UPDATABLE_SHARED_SERVICE_FIELDS: UpdatableSharedServiceField[] = [
  'name',
  'displayName',
  'clientIdentifier',
  'landingPageUrl',
  'description',
  'allowHeadlessOps',
  'allowServiceAccounts',
  'serviceAccountClientIdentifier',
]

const UNIQUE_FIELD_CONDITIONS = {
  name: 'ss.name = :value',
  displayName: 'ss.displayName = :value',
} as const

const isChanged = <T>(
  value: T | null | undefined,
  current: T | null | undefined,
): value is T => value !== undefined && value !== null && value !== current

export class SharedServiceRepository {
  private ensureClientIdentifierIsNotReserved(clientIdentifier: string) {
    if (clientIdentifier === config.oidc.tmsAudience) {
      throw new BadRequestError(
        `Client identifier '${clientIdentifier}' is reserved for CSTAR`,
      )
    }
  }

  private ensureServiceAccountClientIdentifierIsDistinct(
    serviceAccountClientIdentifier: string | null | undefined,
    clientIdentifier: string,
  ) {
    if (!serviceAccountClientIdentifier) {
      return
    }
    this.ensureClientIdentifierIsNotReserved(serviceAccountClientIdentifier)
    if (serviceAccountClientIdentifier === clientIdentifier) {
      throw new BadRequestError(
        `The service account client identifier must be different from the client identifier '${clientIdentifier}'. Use the client ID of the service account's own SSO integration.`,
      )
    }
  }

  private async ensureClientIdentifierIsFree(
    clientIdentifier: string,
    manager: EntityManager,
    excludeSharedServiceId?: string,
  ) {
    if (
      await this.checkIfSharedServiceClientIdentifierExists(
        clientIdentifier,
        manager,
        excludeSharedServiceId,
      )
    ) {
      throw new ConflictError(
        `Client identifier '${clientIdentifier}' is already used by another shared service. Each client identifier can belong to one shared service only.`,
      )
    }
  }

  private async isTakenByAnotherSharedService(
    field: keyof typeof UNIQUE_FIELD_CONDITIONS,
    value: string,
    sharedServiceId: string,
    manager: EntityManager,
  ) {
    return manager
      .createQueryBuilder()
      .from(SharedService, 'ss')
      .where(UNIQUE_FIELD_CONDITIONS[field], { value })
      .andWhere('ss.id != :sharedServiceId', { sharedServiceId })
      .getExists()
  }

  private async ensureUpdatedValuesAreFree(
    input: UpdateSharedServiceInputDto,
    sharedService: SharedService,
    manager: EntityManager,
  ) {
    const {
      sharedServiceId,
      name,
      displayName,
      clientIdentifier,
      serviceAccountClientIdentifier,
    } = input

    if (
      isChanged(name, sharedService.name) &&
      (await this.isTakenByAnotherSharedService(
        'name',
        name,
        sharedServiceId,
        manager,
      ))
    ) {
      throw new ConflictError(
        `A shared service with name '${name}' already exists`,
      )
    }

    if (
      isChanged(displayName, sharedService.displayName) &&
      (await this.isTakenByAnotherSharedService(
        'displayName',
        displayName,
        sharedServiceId,
        manager,
      ))
    ) {
      throw new ConflictError(
        `A shared service with display name '${displayName}' already exists`,
      )
    }

    if (isChanged(clientIdentifier, sharedService.clientIdentifier)) {
      await this.ensureClientIdentifierIsFree(
        clientIdentifier,
        manager,
        sharedServiceId,
      )
    }

    if (
      isChanged(
        serviceAccountClientIdentifier,
        sharedService.serviceAccountClientIdentifier,
      )
    ) {
      await this.ensureClientIdentifierIsFree(
        serviceAccountClientIdentifier,
        manager,
        sharedServiceId,
      )
    }
  }

  private applySharedServiceUpdates(
    sharedService: SharedService,
    input: UpdateSharedServiceInputDto,
  ) {
    for (const field of UPDATABLE_SHARED_SERVICE_FIELDS) {
      if (input[field] !== undefined) {
        Object.assign(sharedService, { [field]: input[field] })
      }
    }
  }

  public async saveSharedService(
    input: CreateSharedServiceInputDto,
    manager: EntityManager,
  ) {
    const {
      name,
      displayName,
      clientIdentifier,
      landingPageUrl,
      description,
      isActive,
      allowHeadlessOps,
      allowServiceAccounts,
      serviceAccountClientIdentifier,
      roles,
      updatedBy,
    } = input

    this.ensureClientIdentifierIsNotReserved(clientIdentifier)
    this.ensureServiceAccountClientIdentifierIsDistinct(
      serviceAccountClientIdentifier,
      clientIdentifier,
    )

    if (await this.checkIfSharedServiceNameExists(name, manager)) {
      throw new ConflictError(
        `A shared service with name '${name}' already exists`,
      )
    }

    if (
      await this.checkIfSharedServiceDisplayNameExists(displayName, manager)
    ) {
      throw new ConflictError(
        `A shared service with display name '${displayName}' already exists`,
      )
    }

    await this.ensureClientIdentifierIsFree(clientIdentifier, manager)

    if (serviceAccountClientIdentifier) {
      await this.ensureClientIdentifierIsFree(
        serviceAccountClientIdentifier,
        manager,
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
    sharedService.isActive = isActive ?? true
    sharedService.allowHeadlessOps = allowHeadlessOps ?? false
    sharedService.allowServiceAccounts = allowServiceAccounts ?? false
    sharedService.serviceAccountClientIdentifier =
      serviceAccountClientIdentifier ?? null
    sharedService.createdBy = updatedBy
    sharedService.updatedBy = updatedBy

    const savedSharedService = await manager.save(sharedService)

    const sharedServiceRoles = roles.map((role) =>
      this.buildSharedServiceRole(role, savedSharedService, updatedBy),
    )
    await manager.save(sharedServiceRoles)

    const savedSharedServiceWithRoles = await this.getSharedServiceWithRoles(
      savedSharedService.id,
      manager,
    )
    if (!savedSharedServiceWithRoles) {
      throw new UnexpectedStateError(
        `Shared service load failed after update: ${savedSharedService.id}`,
      )
    }
    return savedSharedServiceWithRoles
  }

  public async updateSharedService(
    input: UpdateSharedServiceInputDto,
    manager: EntityManager,
  ) {
    const {
      sharedServiceId,
      clientIdentifier,
      serviceAccountClientIdentifier,
      updatedBy,
    } = input

    if (clientIdentifier !== undefined) {
      this.ensureClientIdentifierIsNotReserved(clientIdentifier)
    }

    const sharedService = await manager
      .createQueryBuilder(SharedService, 'sharedService')
      .where('sharedService.id = :id', { id: sharedServiceId })
      .getOne()

    if (!sharedService) {
      throw new NotFoundError(`Shared service not found: ${sharedServiceId}`)
    }

    this.ensureServiceAccountClientIdentifierIsDistinct(
      serviceAccountClientIdentifier === undefined
        ? sharedService.serviceAccountClientIdentifier
        : serviceAccountClientIdentifier,
      clientIdentifier ?? sharedService.clientIdentifier,
    )

    await this.ensureUpdatedValuesAreFree(input, sharedService, manager)

    this.applySharedServiceUpdates(sharedService, input)
    sharedService.updatedBy = updatedBy

    await manager.save(sharedService)

    const updatedSharedService = await this.getSharedServiceWithRoles(
      sharedServiceId,
      manager,
    )
    if (!updatedSharedService) {
      throw new UnexpectedStateError(
        `Shared service load failed after update: ${sharedServiceId}`,
      )
    }

    return updatedSharedService
  }

  public async addSharedServiceRoles(
    input: AddSharedServiceRolesInputDto,
    manager: EntityManager,
  ) {
    const { sharedServiceId, roles, updatedBy } = input

    const sharedService = await manager
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
      const existingRole = await manager
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

    const sharedServiceRoles = roles.map((role) =>
      this.buildSharedServiceRole(role, sharedService, updatedBy),
    )

    await manager.save(sharedServiceRoles)

    return await this.getSharedServiceWithRoles(sharedServiceId, manager)
  }

  public async updateSharedServiceRole(
    input: UpdateSharedServiceRoleInputDto,
    manager: EntityManager,
  ) {
    const {
      sharedServiceId,
      sharedServiceRoleId,
      name,
      description,
      allowedIdentityProviders,
      updatedBy,
    } = input

    const sharedServiceRole = await manager
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
      (await manager
        .createQueryBuilder(SharedServiceRole, 'ssr')
        .where('ssr.name = :name', { name })
        .andWhere('ssr.sharedService.id = :sharedServiceId', {
          sharedServiceId,
        })
        .andWhere('ssr.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('ssr.id != :sharedServiceRoleId', { sharedServiceRoleId })
        .getExists())
    ) {
      throw new ConflictError(
        `A role with name '${name}' already exists for this shared service`,
      )
    }

    if (name !== undefined) {
      sharedServiceRole.name = name
    }
    if (description !== undefined) {
      sharedServiceRole.description = description
    }
    if (allowedIdentityProviders !== undefined) {
      sharedServiceRole.allowedIdentityProviders =
        allowedIdentityProviders && allowedIdentityProviders.length > 0
          ? allowedIdentityProviders
          : null
    }
    sharedServiceRole.updatedBy = updatedBy

    await manager.save(sharedServiceRole)

    const updatedSharedService = await this.getSharedServiceWithRoles(
      sharedServiceId,
      manager,
    )
    if (!updatedSharedService) {
      throw new UnexpectedStateError(
        `Shared service load failed after update: ${sharedServiceId}`,
      )
    }

    return updatedSharedService
  }

  public async updateSharedServiceStatus(
    input: UpdateSharedServiceStatusInputDto,
    manager: EntityManager,
  ) {
    const { sharedServiceId, isActive, updatedBy } = input

    const sharedService = await manager
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

    await manager.save(sharedService)

    const updatedSharedService = await this.getSharedServiceWithRoles(
      sharedServiceId,
      manager,
    )
    if (!updatedSharedService) {
      throw new UnexpectedStateError(
        `Shared service load failed after update: ${sharedServiceId}`,
      )
    }

    return updatedSharedService
  }

  public async associateSharedServiceToTenant(
    input: AssociateSharedServiceToTenantInputDto,
    manager: EntityManager,
  ) {
    const { tenantId, sharedServiceId, updatedBy } = input

    const sharedService = await manager
      .createQueryBuilder(SharedService, 'sharedService')
      .where('sharedService.id = :id', { id: sharedServiceId })
      .getOne()

    if (!sharedService) {
      throw new NotFoundError(`Shared service not found: ${sharedServiceId}`)
    }

    if (!sharedService.isActive) {
      throw new ConflictError(
        `Cannot associate inactive shared service '${sharedService.name}' to tenant`,
      )
    }

    const existingAssociation = await manager
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

    const tenant = await manager
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

    await manager.save(tenantSharedService)
  }

  public async getAllActiveSharedServices(manager?: EntityManager) {
    const em = manager ?? getManager()
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
    const em = manager ?? getManager()
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
    const em = manager ?? getManager()
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
    const em = manager ?? getManager()
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
    const em = manager ?? getManager()
    return em
      .createQueryBuilder()
      .from(SharedService, 'ss')
      .where('ss.displayName = :displayName', { displayName })
      .getExists()
  }

  public async checkIfSharedServiceClientIdentifierExists(
    clientIdentifier: string,
    manager?: EntityManager,
    excludeSharedServiceId?: string,
  ) {
    const em = manager ?? getManager()
    const query = em
      .createQueryBuilder()
      .from(SharedService, 'ss')
      .where(
        '(ss.clientIdentifier = :clientIdentifier OR ss.serviceAccountClientIdentifier = :clientIdentifier)',
        { clientIdentifier },
      )
    if (excludeSharedServiceId) {
      query.andWhere('ss.id != :excludeSharedServiceId', {
        excludeSharedServiceId,
      })
    }
    return query.getExists()
  }

  public async findSharedServiceByClientIdentifier(
    clientIdentifier: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    return em
      .createQueryBuilder(SharedService, 'ss')
      .where('ss.clientIdentifier = :clientIdentifier', { clientIdentifier })
      .getOne()
  }

  public async findSharedServicesByIds(
    sharedServiceIds: string[],
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    return em
      .createQueryBuilder(SharedService, 'ss')
      .where('ss.id IN (:...sharedServiceIds)', { sharedServiceIds })
      .getMany()
  }

  public async checkIfTenantHasSharedServiceAccess(
    tenantId: string,
    clientIdentifier: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
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

  private buildSharedServiceRole(
    role: CreateSharedServiceInputDto['roles'][number],
    sharedService: SharedService,
    updatedBy: string,
  ): SharedServiceRole {
    const sharedServiceRole = new SharedServiceRole()
    sharedServiceRole.name = role.name
    if (role.description !== undefined) {
      sharedServiceRole.description = role.description
    }
    sharedServiceRole.allowedIdentityProviders =
      role.allowedIdentityProviders && role.allowedIdentityProviders.length > 0
        ? role.allowedIdentityProviders
        : null
    sharedServiceRole.sharedService = sharedService
    sharedServiceRole.isDeleted = false
    sharedServiceRole.createdBy = updatedBy
    sharedServiceRole.updatedBy = updatedBy
    return sharedServiceRole
  }
}

export const sharedServiceRepository = new SharedServiceRepository()
