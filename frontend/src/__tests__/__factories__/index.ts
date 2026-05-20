import { Group, toGroupId } from '@/models/group.model'
import { GroupService, toGroupServiceId } from '@/models/groupservice.model'
import {
  GroupServiceRole,
  toGroupServiceRoleId,
} from '@/models/groupservicerole.model'
import { GroupUser, toGroupUserId } from '@/models/groupuser.model'
import { Role, toRoleId } from '@/models/role.model'
import { Service, toServiceId } from '@/models/service.model'
import { ServiceRole, toServiceRoleId } from '@/models/servicerole.model'
import { SsoUser, toSsoUserId } from '@/models/ssouser.model'
import { Tenant, toTenantId } from '@/models/tenant.model'
import { TenantRequest, toTenantRequestId } from '@/models/tenantrequest.model'
import { toUserId, User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

// Group Factory

export function makeGroup(
  overrides: Partial<{
    createdBy: string
    createdDate: string
    description: string
    groupUsers: GroupUser[]
    id: string
    name: string
  }> = {},
): Group {
  return new Group(
    overrides.createdBy ?? 'test-group-created-by',
    overrides.createdDate ?? 'test-group-created-date',
    overrides.description ?? 'test-group-description',
    toGroupId(overrides.id ?? 'test-group-id'),
    overrides.name ?? 'test-group-name',
    overrides.groupUsers ?? [],
  )
}

// Group Service Factory

export function makeGroupService(
  overrides: Partial<{
    clientIdentifier: string
    description: string
    displayName: string
    id: string
    roles: GroupServiceRole[]
  }> = {},
): GroupService {
  return new GroupService(
    toGroupServiceId(overrides.id ?? 'test-group-service-id'),
    overrides.displayName ?? 'test-group-service-display-name',
    overrides.clientIdentifier ?? 'test-group-service-client-identifier',
    overrides.description ?? 'test-group-service-description',
    overrides.roles ?? [makeGroupServiceRole()],
  )
}

// Group Service Role Factory

export function makeGroupServiceRole(
  overrides: Partial<{
    allowedIdentityProviders: string[]
    description: string
    id: string
    isEnabled: boolean
    name: string
  }> = {},
): GroupServiceRole {
  return new GroupServiceRole(
    toGroupServiceRoleId(overrides.id ?? 'test-group-service-role-id'),
    overrides.name ?? 'test-group-service-role-name',
    overrides.description ?? 'test-group-service-role-description',
    overrides.allowedIdentityProviders ?? ['idir'],
    overrides.isEnabled ?? false,
  )
}

// GroupUser Factory

export function makeGroupUser(
  overrides: Partial<{
    id: string
    user: User
  }> = {},
): GroupUser {
  return new GroupUser(
    toGroupUserId(overrides.id ?? 'test-group-user-id'),
    overrides.user ?? makeUser(),
  )
}

// Role Factories

export function makeRole(
  overrides: Partial<{
    description: string
    id: string
    name: string
  }> = {},
): Role {
  return new Role(
    toRoleId(overrides.id ?? 'test-role-id'),
    overrides.name ?? 'test-role-name',
    overrides.description ?? 'test-role-description',
  )
}

export function makeRoleOperationsAdmin(): Role {
  return makeRole({ name: ROLES.OPERATIONS_ADMIN.value })
}

export function makeRoleServiceUser(): Role {
  return makeRole({ name: ROLES.SERVICE_USER.value })
}

export function makeRoleTenantOwner(): Role {
  return makeRole({ name: ROLES.TENANT_OWNER.value })
}

export function makeRoleUserAdmin(): Role {
  return makeRole({ name: ROLES.USER_ADMIN.value })
}

// Service Factory

export function makeService(
  overrides: Partial<{
    clientIdentifier: string
    createdDate: string
    id: string
    description: string
    displayName: string
    roles: ServiceRole[]
  }> = {},
): Service {
  return new Service(
    toServiceId(overrides.id ?? 'test-service-id'),
    overrides.displayName ?? 'test-service-display-name',
    overrides.createdDate ?? 'test-service-created-date',
    overrides.clientIdentifier ?? 'test-service-client-identifier',
    overrides.description ?? 'test-service-description',
    overrides.roles ?? [makeServiceRole()],
  )
}

// Service Role Factory

export function makeServiceRole(
  overrides: Partial<{
    allowedIdentityProviders: string[]
    createdBy: string
    createdDate: string
    description: string
    id: string
    isDeleted: boolean
    name: string
  }> = {},
): ServiceRole {
  return new ServiceRole(
    toServiceRoleId(overrides.id ?? 'test-service-role-id'),
    overrides.name ?? 'test-service-role-name',
    overrides.description ?? 'test-service-role-description',
    overrides.allowedIdentityProviders ?? ['idir'],
    overrides.createdBy ?? 'test-service-created-by',
    overrides.createdDate ?? 'test-service-created-date',
    overrides.isDeleted ?? false,
  )
}

// SsoUser Factory

export function makeSsoUser(
  overrides: Partial<{
    displayName: string
    email: string
    firstName: string
    idpType: string
    lastName: string
    ssoUserId: string
    userName: string
  }> = {},
): SsoUser {
  return new SsoUser(
    toSsoUserId(overrides.ssoUserId ?? 'test-sso-user-id'),
    overrides.userName ?? 'test-sso-user-user-name',
    overrides.firstName ?? 'test-sso-user-first-name',
    overrides.lastName ?? 'test-sso-user-last-name',
    overrides.displayName ?? 'test-sso-user-display-name',
    overrides.email ?? 'test-sso-user-email',
    overrides.idpType ?? 'test-sso-user-idp-type',
  )
}

// Tenant Factory

export function makeTenant(
  overrides: Partial<{
    createdBy: string
    createdDate: string
    description: string
    id: string
    ministryName: string
    name: string
    users: User[]
  }> = {},
): Tenant {
  return new Tenant(
    overrides.createdBy ?? 'test-tenant-created-by',
    overrides.createdDate ?? 'test-tenant-created-date',
    overrides.description ?? 'test-tenant-description',
    toTenantId(overrides.id ?? 'test-tenant-id'),
    overrides.name ?? 'test-tenant-name',
    overrides.ministryName ?? 'test-tenant-ministry-name',
    overrides.users ?? [makeUser()],
  )
}

// Tenant Request Factory

export function makeTenantRequest(
  overrides: Partial<{
    createdBy: string
    createdDate: string
    description: string
    id: string
    ministryName: string
    name: string
    status: string
  }> = {},
): TenantRequest {
  return new TenantRequest(
    overrides.createdBy ?? 'test-tenant-request-created-by',
    overrides.createdDate ?? 'test-tenant-request-created-date',
    overrides.description ?? 'test-tenant-request-description',
    toTenantRequestId(overrides.id ?? 'test-tenant-request-id'),
    overrides.ministryName ?? 'test-tenant-request-ministry-name',
    overrides.name ?? 'test-tenant-request-name',
    overrides.status ?? 'test-tenant-request-status',
  )
}

// User Factories

export function makeUser(
  overrides: Partial<{
    id: string
    roles: Role[]
    ssoUser: SsoUser
  }> = {},
): User {
  return new User(
    toUserId(overrides.id ?? 'test-user-id'),
    overrides.ssoUser ?? makeSsoUser(),
    overrides.roles ?? [],
  )
}

export function makeUserBceid(): User {
  return makeUser({ ssoUser: makeSsoUser({ idpType: 'bceidbasic' }) })
}

export function makeUserIdir(): User {
  return makeUser({ ssoUser: makeSsoUser({ idpType: 'idir' }) })
}

export function makeUserOperationsAdmin(): User {
  return makeUser({ roles: [makeRoleOperationsAdmin()] })
}
