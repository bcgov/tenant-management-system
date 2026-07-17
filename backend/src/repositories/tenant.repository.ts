import { Tenant } from '../entities/Tenant'
import { TenantUser } from '../entities/TenantUser'
import { SSOUser } from '../entities/SSOUser'
import { Role } from '../entities/Role'
import { EntityManager, FindManyOptions, In } from 'typeorm'
import { IdpType, TMSConstants } from '../common/tms.constants'
import { TenantUserRole } from '../entities/TenantUserRole'
import { NotFoundError } from '../errors/NotFoundError'
import { ConflictError } from '../errors/ConflictError'
import { UnexpectedStateError } from '../errors/UnexpectedStateError'
import { getManager } from '../common/db.connection'
import { TenantSharedService } from '../entities/TenantSharedService'
import {
  AssignUserRolesInputDto,
  AddTenantUserInputDto,
  CreateTenantRolesInputDto,
  CreateTenantInputDto,
  GetRolesForSsoUserInputDto,
  GetTenantInputDto,
  GetTenantUserInputDto,
  GetTenantUserResultDto,
  GetTenantUsersInputDto,
  GetTenantRolesInputDto,
  GetUserRolesInputDto,
  GetUserTenantsInputDto,
  RemoveTenantUserInputDto,
  UpdateTenantInputDto,
  UnassignUserRolesInputDto,
} from '../dtos/tms.dto'
import { config } from '../services/config.service'

export class TenantRepository {
  public async saveTenant(input: CreateTenantInputDto, manager: EntityManager) {
    if (
      await this.checkIfTenantNameAndMinistryNameExists(
        input.name,
        input.ministryName,
        manager,
      )
    ) {
      throw new ConflictError(
        `A tenant with name '${input.name}' and ministry name '${input.ministryName}' already exists`,
      )
    }

    const tenantUser: TenantUser = new TenantUser()
    const user = input.user
    const ssoUser: SSOUser = await this.setSSOUser(
      user.ssoUserId,
      user.firstName,
      user.lastName,
      user.displayName,
      user.userName || '',
      user.email || '',
      user.idpType,
      manager,
    )
    tenantUser.ssoUser = ssoUser
    const tenant: Tenant = new Tenant()
    tenant.ministryName = input.ministryName
    tenant.name = input.name
    tenant.users = [tenantUser]
    if (typeof input.description === 'string') {
      tenant.description = input.description
    }
    tenant.createdBy = user.ssoUserId
    tenant.updatedBy = user.ssoUserId

    const savedTenant: Tenant = await manager.save(tenant)

    const globalTenantRoles = [
      TMSConstants.SERVICE_USER,
      TMSConstants.TENANT_OWNER,
      TMSConstants.USER_ADMIN,
    ]

    const roles: Role[] = await this.findRoles(globalTenantRoles, null, manager)

    let savedRoles: Role[]

    if (roles?.length === 0) {
      const newRoles: Role[] = []
      for (const role of globalTenantRoles) {
        const tempRole: Role = new Role()
        tempRole.name = role
        tempRole.description =
          role === TMSConstants.TENANT_OWNER
            ? 'Tenant Owner'
            : role === TMSConstants.SERVICE_USER
              ? 'Service User'
              : role === TMSConstants.USER_ADMIN
                ? 'User Admin'
                : ''
        newRoles.push(tempRole)
      }
      savedRoles = await manager.save(newRoles)
    } else {
      savedRoles = roles
    }

    const tenantUserRoles: TenantUserRole[] = []
    for (const role of savedRoles) {
      const tenantUserRole: TenantUserRole = new TenantUserRole()
      tenantUserRole.role = role
      tenantUserRole.tenantUser = savedTenant.users[0]
      tenantUserRoles.push(tenantUserRole)
    }
    await manager.save(tenantUserRoles)

    const savedTenantWithRelations = await manager
      .createQueryBuilder(Tenant, 'tenant')
      .leftJoinAndSelect('tenant.users', 'tu')
      .leftJoinAndSelect('tu.ssoUser', 'sso')
      .leftJoinAndSelect('tu.roles', 'turoles')
      .leftJoinAndSelect('turoles.role', 'role')
      .where('tenant.id = :id', { id: savedTenant.id })
      .getOne()

    if (!savedTenantWithRelations) {
      throw new UnexpectedStateError('Tenant creation failed')
    }

    return savedTenantWithRelations
  }

  public async updateTenant(
    input: UpdateTenantInputDto,
    manager: EntityManager,
  ) {
    const tenantId: string = input.tenantId
    const { name, ministryName, description, updatedBy } = input

    const currentTenant = await manager
      .createQueryBuilder(Tenant, 'tenant')
      .where('tenant.id = :tenantId', { tenantId })
      .getOne()

    if (name || ministryName) {
      const effectiveName = name ?? currentTenant?.name ?? ''
      const effectiveMinistryName =
        ministryName ?? currentTenant?.ministryName ?? ''

      const existingTenant = await manager
        .createQueryBuilder(Tenant, 't')
        .where('t.name = :name', { name: effectiveName })
        .andWhere('t.ministry_name = :ministryName', {
          ministryName: effectiveMinistryName,
        })
        .andWhere('t.id != :tenantId', { tenantId })
        .getOne()

      if (existingTenant) {
        throw new ConflictError(
          `A tenant with name '${effectiveName}' and ministry name '${effectiveMinistryName}' already exists`,
        )
      }
    }

    await manager
      .createQueryBuilder()
      .update(Tenant)
      .set({
        ...(name !== undefined && { name }),
        ...(ministryName !== undefined && { ministryName }),
        ...(description !== undefined && { description }),
        updatedBy,
      })
      .where('id = :tenantId', { tenantId })
      .execute()

    const tenant = await manager
      .createQueryBuilder(Tenant, 'tenant')
      .where('tenant.id = :id', { id: tenantId })
      .getOne()

    if (!tenant) {
      throw new UnexpectedStateError('Tenant update failed')
    }

    const createdBy: SSOUser | null = tenant.createdBy
      ? await manager.findOne(SSOUser, {
          where: { ssoUserId: tenant.createdBy },
        })
      : null

    return {
      ...tenant,
      createdBy: createdBy?.userName || tenant.createdBy,
    }
  }

  public async addTenantUsers(
    input: AddTenantUserInputDto,
    manager: EntityManager,
  ) {
    const tenantId: string = input.tenantId
    const user = input.user
    const ssoUserId: string = user.ssoUserId
    const updatedBy: string = input.updatedBy

    const tenant = await this.getTenantIfUserDoesNotExistForTenant(
      ssoUserId,
      tenantId,
      manager,
    )

    if (!tenant) {
      const softDeletedUser = await this.findSoftDeletedTenantUser(
        ssoUserId,
        tenantId,
        manager,
      )

      if (softDeletedUser) {
        softDeletedUser.isDeleted = false
        softDeletedUser.updatedBy = updatedBy
        softDeletedUser.updatedDateTime = new Date()

        const restoredTenantUser: TenantUser =
          await manager.save(softDeletedUser)

        const restoredTenantUserWithRelations = await manager
          .createQueryBuilder(TenantUser, 'tu')
          .leftJoinAndSelect('tu.ssoUser', 'ssoUser')
          .where('tu.id = :tenantUserId', {
            tenantUserId: restoredTenantUser.id,
          })
          .getOne()

        const roleAssignments: TenantUserRole[] = await this.assignUserRoles(
          tenantId,
          restoredTenantUser.id,
          await this.getRoleIdsToAssign(user.idpType, input.roles, manager),
          manager,
        )

        if (!restoredTenantUserWithRelations) {
          throw new UnexpectedStateError(
            `Failed to load restored tenant user: ${restoredTenantUser.id}`,
          )
        }
        return {
          savedTenantUser: restoredTenantUserWithRelations,
          roleAssignments,
          tenantUserId: restoredTenantUser.id,
        }
      } else {
        const activeUser = await this.getTenantUserBySsoId(
          ssoUserId,
          tenantId,
          manager,
        )
        if (activeUser) {
          throw new ConflictError(
            'User is already added to this tenant: ' + tenantId,
          )
        } else {
          throw new NotFoundError(
            'User was previously offboarded but cannot be restored. Please contact support.',
          )
        }
      }
    } else {
      const tenantUser: TenantUser = new TenantUser()
      tenantUser.tenant = tenant
      tenantUser.createdBy = updatedBy
      tenantUser.updatedBy = updatedBy
      const ssoUser: SSOUser = await this.setSSOUser(
        user.ssoUserId,
        user.firstName,
        user.lastName,
        user.displayName,
        user.userName || '',
        user.email || '',
        user.idpType,
        manager,
      )
      tenantUser.ssoUser = ssoUser

      const savedTenantUser: TenantUser = await manager.save(tenantUser)

      const roleAssignments = await this.assignUserRoles(
        tenantId,
        savedTenantUser.id,
        await this.getRoleIdsToAssign(user.idpType, input.roles, manager),
        manager,
      )

      return {
        savedTenantUser,
        roleAssignments,
        tenantUserId: savedTenantUser.id,
      }
    }
  }

  private async getRoleIdsToAssign(
    idpType: IdpType,
    requestedRoles: string[] | undefined,
    manager: EntityManager,
  ) {
    if (idpType === 'bceidbusiness') {
      const serviceUserRole: Role[] = await this.findRoles(
        [TMSConstants.SERVICE_USER],
        null,
        manager,
      )
      if (serviceUserRole.length === 0) {
        throw new NotFoundError('SERVICE_USER role not found')
      }
      return [serviceUserRole[0].id]
    }
    return requestedRoles || []
  }

  public async createRoles(
    input: CreateTenantRolesInputDto,
    manager: EntityManager,
  ) {
    const tenantId: string = input.tenantId
    const requestRole = input.role

    const tenant = await manager.findOne(Tenant, {
      where: { id: tenantId },
    })
    if (!tenant) {
      throw new NotFoundError('Tenant Not Found: ' + tenantId)
    }

    const dbRoles: Role[] = await this.findRoles(
      [requestRole.name],
      tenantId,
      manager,
    )

    if (dbRoles?.length !== 0) {
      throw new ConflictError(
        'Role already exists for tenant: ' +
          tenantId +
          ' : ' +
          requestRole.name,
      )
    }

    const role: Role = new Role()
    role.name = requestRole.name
    role.description = requestRole.description
    return manager.save(role)
  }

  public async getExistingRolesForUser(
    tenantUserId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const tenantUser: TenantUser | null = await em
      .createQueryBuilder(TenantUser, 'tenantUser')
      .leftJoinAndSelect('tenantUser.roles', 'tenantUserRole')
      .leftJoinAndSelect('tenantUserRole.role', 'role')
      .where('tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('tenantUser.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('tenantUserRole.is_deleted = :isDeleted', { isDeleted: false })
      .getOne()

    return tenantUser?.roles?.map((tur) => tur.role) || []
  }

  public async assignUserRoles(
    tenantId: string,
    tenantUserId: string,
    roleIds: string[],
    manager: EntityManager,
  ) {
    const tenantUser = await manager.findOne(TenantUser, {
      where: { id: tenantUserId, isDeleted: false },
    })
    if (!tenantUser) {
      throw new NotFoundError(`Tenant user not found: ${tenantUserId}`)
    }

    const existingRoles: Role[] = await this.getExistingRolesForUser(
      tenantUserId,
      manager,
    )

    const trWhere: FindManyOptions<Role> = {
      tenant: { id: tenantId },
    } as FindManyOptions<Role>

    const tenantRoles: Role[] = await manager.find(Role, trWhere)
    const existingRoleIds: string[] = existingRoles.map((role) => role.id)

    const bceidAllowedRoleIds: string[] = tenantRoles
      .filter((role) => role.name === TMSConstants.SERVICE_USER)
      .map((role) => role.id)

    const softDeletedRoleAssignments: TenantUserRole[] = await manager
      .createQueryBuilder(TenantUserRole, 'tur')
      .leftJoinAndSelect('tur.role', 'role')
      .where('tur.tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('tur.isDeleted = :isDeleted', { isDeleted: true })
      .andWhere('role.id IN (:...roleIds)', { roleIds })
      .getMany()

    const rolesToRestore: TenantUserRole[] = []
    const rolesToCreate: string[] = []

    for (const roleId of roleIds) {
      if (
        tenantUser.ssoUser.idpType.toLowerCase() === 'idir' ||
        bceidAllowedRoleIds.indexOf(roleId) !== -1
      ) {
        const softDeletedAssignment = softDeletedRoleAssignments.find(
          (tur) => tur.role.id === roleId,
        )
        if (softDeletedAssignment) {
          softDeletedAssignment.isDeleted = false
          softDeletedAssignment.updatedBy = 'system'
          softDeletedAssignment.updatedDateTime = new Date()
          rolesToRestore.push(softDeletedAssignment)
        } else if (!existingRoleIds.includes(roleId)) {
          rolesToCreate.push(roleId)
        }
      }
    }

    const savedAssignments: TenantUserRole[] = []

    if (rolesToRestore.length > 0) {
      const restoredAssignments = await manager.save(rolesToRestore)
      savedAssignments.push(...restoredAssignments)
    }

    if (rolesToCreate.length > 0) {
      const validRoles: Role[] = await manager
        .createQueryBuilder(Role, 'role')
        .where('role.id IN (:...roleIds)', { roleIds: rolesToCreate })
        .getMany()

      if (validRoles.length !== rolesToCreate.length) {
        throw new NotFoundError('Role(s) not found')
      }

      const newAssignments: TenantUserRole[] = validRoles.map((role) => {
        const tenantUserRole: TenantUserRole = new TenantUserRole()
        tenantUserRole.tenantUser = tenantUser
        tenantUserRole.role = role
        return tenantUserRole
      })

      const createdAssignments = await manager.save(newAssignments)
      savedAssignments.push(...createdAssignments)
    }

    if (savedAssignments.length === 0) {
      throw new ConflictError('All roles are already assigned to the user')
    }

    return savedAssignments
  }

  public async assignUserRolesForUser(
    input: AssignUserRolesInputDto,
    manager: EntityManager,
  ) {
    return this.assignUserRoles(
      input.tenantId,
      input.tenantUserId,
      input.roleIds,
      manager,
    )
  }

  public async getTenantRoles(
    input: GetTenantRolesInputDto,
    manager?: EntityManager,
  ) {
    void input
    return this.findTenantRoles(manager)
  }

  public async getUserRoles(
    input: GetUserRolesInputDto,
    manager?: EntityManager,
  ) {
    const tenantUserId = input.tenantUserId
    void input.tenantId
    return this.getRolesForUser(tenantUserId, manager)
  }

  public async unassignUserRoles(
    input: UnassignUserRolesInputDto,
    manager: EntityManager,
  ) {
    const tenantId = input.tenantId
    const tenantUserId = input.tenantUserId
    const roleId = input.roleId
    const assignedTenantUserRole = await this.getTenantUserRole(
      tenantId,
      tenantUserId,
      roleId,
      manager,
    )

    if (!assignedTenantUserRole) {
      throw new NotFoundError(
        'Tenant: ' +
          tenantId +
          ',  Users: ' +
          tenantUserId +
          ' and / or roles: ' +
          roleId +
          ' not found',
      )
    }

    const role = await manager.findOne(Role, { where: { id: roleId } })
    if (role?.name === TMSConstants.TENANT_OWNER) {
      const otherTenantOwnersCount: number = await manager
        .createQueryBuilder(TenantUserRole, 'tenantUserRole')
        .innerJoin('tenantUserRole.tenantUser', 'tenantUser')
        .innerJoin('tenantUserRole.role', 'role')
        .where('tenantUser.tenant.id = :tenantId', { tenantId })
        .andWhere('role.name = :roleName', {
          roleName: TMSConstants.TENANT_OWNER,
        })
        .andWhere('tenantUserRole.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('tenantUserRole.tenantUser.id != :tenantUserId', {
          tenantUserId,
        })
        .getCount()

      if (otherTenantOwnersCount === 0) {
        throw new ConflictError(
          'Cannot unassign tenant owner role. At least one tenant owner must remain.',
        )
      }
    }

    const userRoleCount: number = await manager
      .createQueryBuilder(TenantUserRole, 'tenantUserRole')
      .innerJoin('tenantUserRole.tenantUser', 'tenantUser')
      .where('tenantUser.tenant.id = :tenantId', { tenantId })
      .andWhere('tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('tenantUserRole.isDeleted = :isDeleted', { isDeleted: false })
      .getCount()

    if (userRoleCount === 1) {
      throw new ConflictError(
        'Cannot unassign the last role from a user. User must have at least one role in the tenant',
      )
    }

    await manager.update(
      TenantUserRole,
      {
        tenantUser: { id: tenantUserId },
        role: { id: roleId },
      },
      {
        isDeleted: true,
        updatedBy: input.updatedBy,
      },
    )
  }

  public async checkUserTenantAccess(
    tenantId: string,
    ssoUserId: string,
    requiredRoles?: string[],
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const query = em
      .createQueryBuilder()
      .from(TenantUser, 'tu')
      .innerJoin('tu.ssoUser', 'su')
      .where('tu.tenant_id = :tenantId', { tenantId })
      .andWhere('su.ssoUserId = :ssoUserId', { ssoUserId })
      .andWhere('tu.isDeleted = :isDeleted', { isDeleted: false })

    if (requiredRoles && requiredRoles.length > 0) {
      query
        .innerJoin('tu.roles', 'tur')
        .innerJoin('tur.role', 'role')
        .andWhere('role.name IN (:...requiredRoles)', { requiredRoles })
        .andWhere('tur.isDeleted = :isDeleted', { isDeleted: false })
    }

    return await query.getExists()
  }

  public async getUserTenantAccessWithRoles(
    tenantId: string,
    ssoUserId: string,
    requiredRoles?: string[],
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const query = em
      .createQueryBuilder(TenantUser, 'tu')
      .leftJoinAndSelect('tu.ssoUser', 'su')
      .leftJoinAndSelect('tu.roles', 'tur')
      .leftJoinAndSelect('tur.role', 'role')
      .where('tu.tenant_id = :tenantId', { tenantId })
      .andWhere('su.ssoUserId = :ssoUserId', { ssoUserId })
      .andWhere('tu.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('tur.isDeleted = :isDeleted', { isDeleted: false })

    const tenantUser = await query.getOne()

    if (!tenantUser) {
      return {
        hasAccess: false,
        user: null,
        roles: [],
        tenantId,
        ssoUserId,
      }
    }

    const userRoles: string[] =
      tenantUser.roles?.map((tur) => tur.role.name) || []
    const hasRequiredRoles: boolean =
      !requiredRoles ||
      requiredRoles.length === 0 ||
      requiredRoles.some((role) => userRoles.includes(role))

    return {
      hasAccess: hasRequiredRoles,
      user: tenantUser,
      roles: userRoles,
      tenantId,
      ssoUserId,
    }
  }

  private async getCreatorUser(
    ssoUserId: string,
    manager?: EntityManager,
  ): Promise<SSOUser | null> {
    const em = manager ?? getManager()
    return em.findOne(SSOUser, {
      where: { ssoUserId },
    })
  }

  public async getTenant(input: GetTenantInputDto, manager?: EntityManager) {
    const em = manager ?? getManager()
    const tenantId: string = input.tenantId
    const expand: string[] = input.expand

    const tenantQuery = em
      .createQueryBuilder(Tenant, 'tenant')
      .where('tenant.id = :tenantId', { tenantId })

    if (expand.includes('tenantUserRoles')) {
      tenantQuery
        .leftJoinAndSelect('tenant.users', 'user')
        .leftJoinAndSelect('user.ssoUser', 'ssoUser')
      tenantQuery.leftJoinAndSelect('user.roles', 'tenantUserRole')
      tenantQuery.leftJoinAndSelect('tenantUserRole.role', 'role')
      tenantQuery.andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
    }
    const tenant = await tenantQuery.getOne()

    if (!tenant) {
      throw new NotFoundError('Tenant Not Found: ' + tenantId)
    }

    if (expand.includes('tenantUserRoles') && tenant.users) {
      tenant.users = tenant.users.map((user: TenantUser) => {
        if (user.roles) {
          const activeRoles = user.roles.filter(
            (tur: TenantUserRole) => !tur.isDeleted && tur.role,
          )
          return {
            ...user,
            roles: activeRoles,
          }
        }
        return user
      })
    }

    const normalizedCreatedBy = tenant.createdBy?.trim()

    if (normalizedCreatedBy) {
      let createdByUserName: string | undefined
      let createdByDisplayName: string | undefined
      if (normalizedCreatedBy === 'system') {
        createdByUserName = 'system'
        createdByDisplayName = 'system'
      } else {
        const creator = await this.getCreatorUser(normalizedCreatedBy, em)
        createdByUserName = creator?.userName
        createdByDisplayName = creator?.displayName
      }
      ;(tenant as Tenant & { createdByUserName?: string }).createdByUserName =
        createdByUserName
      ;(
        tenant as Tenant & { createdByDisplayName?: string }
      ).createdByDisplayName = createdByDisplayName
    }
    return tenant
  }

  public async getRolesForSSOUser(
    input: GetRolesForSsoUserInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const tenantId: string = input.tenantId
    const ssoUserId: string = input.ssoUserId

    if (!(await this.checkIfTenantExists(tenantId, em))) {
      throw new NotFoundError('Tenant Not Found: ' + tenantId)
    }

    return this.getRolesForSSOUserAndTenant(tenantId, ssoUserId, em)
  }

  public async getRolesForSSOUserAndTenant(
    tenantId: string,
    ssoUserId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const roles: Role[] = await em
      .createQueryBuilder(Role, 'role')
      .innerJoin('role.tenantUserRoles', 'tenantUserRole')
      .innerJoin('tenantUserRole.tenantUser', 'tenantUser')
      .innerJoin('tenantUser.tenant', 'tenant')
      .innerJoin('tenantUser.ssoUser', 'ssoUser')
      .where('tenant.id = :tenantId', { tenantId })
      .andWhere('ssoUser.ssoUserId = :ssoUserId', { ssoUserId })
      .andWhere('tenantUser.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('tenantUserRole.isDeleted = :isDeleted', { isDeleted: false })
      .getMany()
    return roles
  }

  public async getTenantUserRole(
    tenantId: string,
    tenantUserId: string,
    roleId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    return em
      .createQueryBuilder(TenantUserRole, 'tenantUserRole')
      .innerJoin('tenantUserRole.tenantUser', 'tenantUser')
      .innerJoin('tenantUserRole.role', 'role')
      .innerJoin('tenantUser.tenant', 'tenant')
      .where('tenant.id = :tenantId', { tenantId })
      .andWhere('tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('role.id = :roleId', { roleId })
      .andWhere('tenantUserRole.isDeleted = :isDeleted', { isDeleted: false })
      .getOne()
  }

  public async checkIfTenantUserExistsForTenant(
    tenantId: string,
    tenantUserId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    return em
      .createQueryBuilder(TenantUser, 'tu')
      .where('tu.id = :tenantUserId', { tenantUserId })
      .andWhere('tu.tenant_id = :tenantId', { tenantId })
      .andWhere('tu.isDeleted = :isDeleted', { isDeleted: false })
      .getExists()
  }

  public async getRolesForUser(tenantUserId: string, manager?: EntityManager) {
    const em = manager ?? getManager()
    return em
      .createQueryBuilder(Role, 'role')
      .innerJoin('TenantUserRole', 'tur', 'tur.role_id = role.id')
      .innerJoin('TenantUser', 'tu', 'tu.id = tur.tenant_user_id')
      .where('tu.id = :tenantUserId', { tenantUserId })
      .andWhere('tu.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('tur.isDeleted = :isDeleted', { isDeleted: false })
      .getMany()
  }

  public async getTenantUser(
    input: GetTenantUserInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const tenantId: string = input.tenantId
    const tenantUserId: string = input.tenantUserId
    const expand: string[] = input.expand
    const expandRoles = expand.includes('roles')

    const tenantUserQuery = em
      .createQueryBuilder(TenantUser, 'tenantUser')
      .leftJoinAndSelect('tenantUser.ssoUser', 'ssoUser')
      .leftJoin('tenantUser.tenant', 'tenant')
      .where('tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('tenant.id = :tenantId', { tenantId })
      .andWhere('tenantUser.isDeleted = :isDeleted', { isDeleted: false })

    if (expandRoles) {
      tenantUserQuery
        .leftJoinAndSelect('tenantUser.roles', 'tenantUserRole')
        .leftJoinAndSelect('tenantUserRole.role', 'role')
        .andWhere('tenantUserRole.isDeleted = :isDeleted', { isDeleted: false })
    }

    const tenantUser = await tenantUserQuery.getOne()

    if (!tenantUser) {
      throw new NotFoundError(`Tenant user not found: ${tenantUserId}`)
    }

    const result: GetTenantUserResultDto = {
      id: tenantUser.id,
      ssoUser: tenantUser.ssoUser,
      createdDateTime: tenantUser.createdDateTime,
      updatedDateTime: tenantUser.updatedDateTime,
      createdBy: tenantUser.createdBy,
      updatedBy: tenantUser.updatedBy,
    }

    if (expandRoles && tenantUser.roles) {
      result.roles = tenantUser.roles.map(
        (tenantUserRole: TenantUserRole) => tenantUserRole.role,
      )
    }

    return result
  }

  public async getTenantsUsersAndRoles(
    tenantId: string,
    tenantUserId: string,
    roleId: string,
    manager: EntityManager,
  ) {
    return manager
      .createQueryBuilder(Tenant, 'tenant')
      .leftJoinAndSelect('tenant.users', 'tenantUser')
      .leftJoinAndSelect('tenantUser.ssoUser', 'ssoUser')
      .leftJoinAndSelect('tenantUser.roles', 'turoles')
      .leftJoinAndSelect('turoles.role', 'role')
      .where('tenant.id = :tenantId', { tenantId })
      .andWhere('tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('tenantUser.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('turoles.isDeleted = :isDeleted', { isDeleted: false })
      .getOne()
  }

  public async checkIfTenantExists(tenantId: string, manager?: EntityManager) {
    const em = manager ?? getManager()
    return em
      .createQueryBuilder()
      .from(Tenant, 't')
      .where('t.id = :tenantId', { tenantId })
      .getExists()
  }

  public async checkIfTenantNameAndMinistryNameExists(
    name: string,
    ministryName: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    return em
      .createQueryBuilder()
      .from(Tenant, 't')
      .where('t.name = :name', { name })
      .andWhere('t.ministry_name = :ministryName', { ministryName })
      .getExists()
  }

  public async getTenantsForUser(
    input: GetUserTenantsInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const ssoUserId: string = input.ssoUserId
    const expand: string[] = input.expand
    const jwtAudience: string = input.jwtAudience || config.oidc.tmsAudience

    const tenantQuery = em.createQueryBuilder(Tenant, 't').where((qb) => {
      const subQuery = qb
        .subQuery()
        .select('1')
        .from(TenantUser, 'tu')
        .innerJoin('tu.ssoUser', 'su')
        .where('tu.tenant.id = t.id')
        .andWhere('su.ssoUserId = :ssoUserId', { ssoUserId })
        .andWhere('tu.isDeleted = :tuDeleted', { tuDeleted: false })
        .getQuery()
      return `EXISTS (${subQuery})`
    })

    if (jwtAudience !== config.oidc.tmsAudience) {
      tenantQuery.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from(TenantSharedService, 'tss')
          .innerJoin('tss.sharedService', 'ss')
          .where('tss.tenant.id = t.id')
          .andWhere('ss.clientIdentifier = :jwtAudience', { jwtAudience })
          .andWhere('tss.isDeleted = :tssDeleted', { tssDeleted: false })
          .andWhere('ss.isActive = :ssActive', { ssActive: true })
          .getQuery()
        return `EXISTS (${subQuery})`
      })
    }

    if (expand?.includes('tenantUserRoles')) {
      tenantQuery
        .leftJoinAndSelect('t.users', 'user')
        .leftJoinAndSelect('user.ssoUser', 'ssoUser')
        .leftJoinAndSelect('user.roles', 'tenantUserRole')
        .leftJoinAndSelect('tenantUserRole.role', 'role')
        .andWhere('tenantUserRole.isDeleted = :turDeleted', {
          turDeleted: false,
        })
        .andWhere('user.isDeleted = :userDeleted', { userDeleted: false })
    }

    const tenants: Tenant[] = await tenantQuery.getMany()
    return tenants
  }

  public async getUsersForTenant(
    input: GetTenantUsersInputDto,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const tenantId = input.tenantId
    const groupIds = input.groupIds
    const sharedServiceRoleIds = input.sharedServiceRoleIds
    const query = em
      .createQueryBuilder(TenantUser, 'tu')
      .innerJoinAndSelect('tu.ssoUser', 'su')
      .innerJoin('tu.tenant', 'tenant')
      .where('tenant.id = :tenantId', { tenantId })
      .andWhere('tu.isDeleted = :isDeleted', { isDeleted: false })

    if (groupIds && groupIds.length > 0) {
      query
        .leftJoin('GroupUser', 'gu', 'gu.tenant_user_id = tu.id')
        .andWhere('gu.group_id IN (:...groupIds)', { groupIds })
        .andWhere('gu.is_deleted = :guIsDeleted', { guIsDeleted: false })
    }

    if (sharedServiceRoleIds && sharedServiceRoleIds.length > 0) {
      if (!groupIds || groupIds.length === 0) {
        query
          .leftJoin('GroupUser', 'gu', 'gu.tenant_user_id = tu.id')
          .andWhere('gu.is_deleted = :guIsDeleted', { guIsDeleted: false })
      }
      query
        .leftJoin('Group', 'g', 'g.id = gu.group_id')
        .leftJoin('GroupSharedServiceRole', 'gssr', 'gssr.group_id = g.id')
        .andWhere('gssr.shared_service_role_id IN (:...sharedServiceRoleIds)', {
          sharedServiceRoleIds,
        })
        .andWhere('gssr.is_deleted = :gssrIsDeleted', { gssrIsDeleted: false })
    }

    if (
      (groupIds && groupIds.length > 0) ||
      (sharedServiceRoleIds && sharedServiceRoleIds.length > 0)
    ) {
      query.distinct(true)
    }

    const users = await query.getMany()
    return users
  }

  public async getTenantIfUserDoesNotExistForTenant(
    ssoUserId: string,
    tenantId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const tenant = await em
      .createQueryBuilder(Tenant, 't')
      .where('t.id = :tenantId', { tenantId })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from(TenantUser, 'tu')
          .innerJoin(SSOUser, 'su', 'tu.sso_id = su.id')
          .where('tu.tenant_id = t.id')
          .andWhere('su.ssoUserId = :ssoUserId', { ssoUserId })
          .getQuery()
        return `NOT EXISTS (${subQuery})`
      })
      .getOne()
    return tenant
  }

  public async findSoftDeletedTenantUser(
    ssoUserId: string,
    tenantId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const softDeletedUser = await em
      .createQueryBuilder(TenantUser, 'tu')
      .innerJoin('tu.ssoUser', 'su')
      .innerJoin('tu.tenant', 'tenant')
      .where('tenant.id = :tenantId', { tenantId })
      .andWhere('su.ssoUserId = :ssoUserId', { ssoUserId })
      .andWhere('tu.isDeleted = :isDeleted', { isDeleted: true })
      .getOne()

    return softDeletedUser
  }

  public async findRoles(
    roleNames: string[],
    tenantId: string | null,
    manager?: EntityManager,
  ): Promise<Role[]> {
    const em = manager ?? getManager()
    const whereCondition: {
      name: ReturnType<typeof In>
      tenant?: { id: string }
    } = {
      name: In(roleNames),
    }
    if (tenantId) {
      whereCondition.tenant = { id: tenantId }
    }
    const roles: Role[] = await em.find(Role, {
      where: whereCondition,
    })
    return roles ?? []
  }

  public async setSSOUser(
    ssoUserId: string,
    firstName: string,
    lastName: string,
    displayName: string,
    userName: string,
    email: string,
    idpType: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    let ssoUser = await em.findOne(SSOUser, {
      where: { ssoUserId: ssoUserId },
    })
    if (!ssoUser) {
      ssoUser = new SSOUser()
      ssoUser.firstName = firstName
      ssoUser.lastName = lastName
      ssoUser.displayName = displayName
      ssoUser.userName = userName
      ssoUser.ssoUserId = ssoUserId
      ssoUser.email = email ?? ''
      ssoUser.idpType = idpType
      ssoUser.createdBy = ssoUserId
      ssoUser.updatedBy = ssoUserId
    }
    return ssoUser
  }

  public async findTenantRoles(manager?: EntityManager) {
    const em = manager ?? getManager()
    return em.createQueryBuilder(Role, 'role').getMany()
  }

  public async getTenantUserBySsoId(
    ssoUserId: string,
    tenantId: string,
    manager?: EntityManager,
  ) {
    const em = manager ?? getManager()
    const tenantUser = await em
      .createQueryBuilder(TenantUser, 'tenantUser')
      .leftJoinAndSelect('tenantUser.ssoUser', 'ssoUser')
      .where('tenantUser.tenant.id = :tenantId', { tenantId })
      .andWhere('ssoUser.ssoUserId = :ssoUserId', { ssoUserId })
      .andWhere('tenantUser.isDeleted = :isDeleted', { isDeleted: false })
      .getOne()

    return tenantUser
  }

  public async assignDefaultRoleToUser(
    tenantUserId: string,
    tenantId: string,
    manager: EntityManager,
  ) {
    const serviceUserRole: Role[] = await this.findRoles(
      [TMSConstants.SERVICE_USER],
      null,
      manager,
    )
    if (serviceUserRole.length === 0) {
      throw new NotFoundError('SERVICE_USER role not found')
    }

    await this.assignUserRoles(
      tenantId,
      tenantUserId,
      [serviceUserRole[0].id],
      manager,
    )
  }

  public async ensureTenantUserExists(
    user: AddTenantUserInputDto['user'],
    tenantId: string,
    updatedBy: string,
    manager: EntityManager,
  ) {
    const existingTenant = await this.getTenantIfUserDoesNotExistForTenant(
      user.ssoUserId,
      tenantId,
      manager,
    )

    if (!existingTenant) {
      let existingTenantUser = await this.getTenantUserBySsoId(
        user.ssoUserId,
        tenantId,
        manager,
      )

      if (!existingTenantUser) {
        const softDeletedUser = await this.findSoftDeletedTenantUser(
          user.ssoUserId,
          tenantId,
          manager,
        )

        if (softDeletedUser) {
          softDeletedUser.isDeleted = false
          softDeletedUser.updatedBy = updatedBy
          softDeletedUser.updatedDateTime = new Date()

          existingTenantUser = await manager.save(softDeletedUser)

          const serviceUserRole = await this.findRoles(
            [TMSConstants.SERVICE_USER],
            null,
            manager,
          )
          if (serviceUserRole.length > 0) {
            await this.assignUserRoles(
              tenantId,
              existingTenantUser.id,
              [serviceUserRole[0].id],
              manager,
            )
          }
        }
      }
      return existingTenantUser
    } else {
      const serviceUserRole = await this.findRoles(
        [TMSConstants.SERVICE_USER],
        null,
        manager,
      )
      if (serviceUserRole.length === 0) {
        throw new NotFoundError('Service User role not found')
      }

      const tenantUser: TenantUser = new TenantUser()
      tenantUser.tenant = existingTenant
      tenantUser.createdBy = updatedBy
      tenantUser.updatedBy = updatedBy
      const ssoUser: SSOUser = await this.setSSOUser(
        user.ssoUserId,
        user.firstName,
        user.lastName,
        user.displayName,
        user.userName || '',
        user.email || '',
        user.idpType,
        manager,
      )
      tenantUser.ssoUser = ssoUser

      const savedTenantUser: TenantUser = await manager.save(tenantUser)

      await this.assignUserRoles(
        tenantId,
        savedTenantUser.id,
        [serviceUserRole[0].id],
        manager,
      )

      return savedTenantUser
    }
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

  public async removeTenantUser(
    input: RemoveTenantUserInputDto,
    manager: EntityManager,
  ) {
    const tenantUserId = input.tenantUserId
    const tenantId = input.tenantId
    const deletedBy = input.deletedBy

    const tenantUser = await manager
      .createQueryBuilder(TenantUser, 'tu')
      .leftJoinAndSelect('tu.roles', 'tur')
      .leftJoinAndSelect('tur.role', 'role')
      .where('tu.id = :tenantUserId', { tenantUserId })
      .andWhere('tu.tenant.id = :tenantId', { tenantId })
      .andWhere('tu.isDeleted = :isDeleted', { isDeleted: false })
      .getOne()

    if (!tenantUser) {
      throw new NotFoundError(
        `Tenant user not found or already deleted: ${tenantUserId}`,
      )
    }

    const tenantOwnerRoles =
      tenantUser.roles?.filter(
        (tur) => tur.role.name === TMSConstants.TENANT_OWNER && !tur.isDeleted,
      ) || []

    if (tenantOwnerRoles.length > 0) {
      const otherTenantOwnersCount: number = await manager
        .createQueryBuilder(TenantUserRole, 'tur')
        .innerJoin('tur.tenantUser', 'tu')
        .innerJoin('tur.role', 'role')
        .where('tu.tenant.id = :tenantId', { tenantId })
        .andWhere('role.name = :roleName', {
          roleName: TMSConstants.TENANT_OWNER,
        })
        .andWhere('tur.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('tu.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('tu.id != :tenantUserId', { tenantUserId })
        .getCount()

      if (otherTenantOwnersCount === 0) {
        throw new ConflictError(
          'Cannot remove the last tenant owner. At least one tenant owner must remain.',
        )
      }
    }

    await manager
      .createQueryBuilder()
      .update(TenantUserRole)
      .set({
        isDeleted: true,
        updatedBy: deletedBy,
      })
      .where('tenantUser.id = :tenantUserId', { tenantUserId })
      .andWhere('isDeleted = :isDeleted', { isDeleted: false })
      .execute()

    await manager
      .createQueryBuilder()
      .update(TenantUser)
      .set({
        isDeleted: true,
        updatedBy: deletedBy,
      })
      .where('id = :tenantUserId', { tenantUserId })
      .execute()
  }
}

export const tenantRepository = new TenantRepository()
