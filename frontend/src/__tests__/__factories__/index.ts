import { type GroupServiceRoleApiData } from '@/mappers/groupservicerole.mapper'
import { type GroupUserApiData } from '@/mappers/groupuser.mapper'
import { type RoleApiData } from '@/mappers/role.mapper'
import { type ServiceRoleApiData } from '@/mappers/servicerole.mapper'
import { type SsoUserApiData } from '@/mappers/ssouser.mapper'
import { type UserApiData } from '@/mappers/user.mapper'
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

export const makeGroup = (
  overrides: Partial<{
    createdBy: string
    createdDate: string
    description: string
    groupUsers: GroupUser[]
    id: string
    name: string
  }> = {},
): Group => {
  return new Group({
    createdBy: overrides.createdBy ?? 'test-group-created-by',
    createdDate: overrides.createdDate ?? 'test-group-created-date',
    description: overrides.description ?? 'test-group-description',
    groupUsers: overrides.groupUsers ?? [],
    id: toGroupId(overrides.id ?? 'test-group-id'),
    name: overrides.name ?? 'test-group-name',
  })
}

// Group Service Factory

export const makeGroupService = (
  overrides: Partial<{
    clientIdentifier: string
    description: string
    displayName: string
    id: string
    roles: GroupServiceRole[]
  }> = {},
): GroupService => {
  return new GroupService({
    clientIdentifier:
      overrides.clientIdentifier ?? 'test-group-service-client-identifier',
    description: overrides.description ?? 'test-group-service-description',
    displayName: overrides.displayName ?? 'test-group-service-display-name',
    id: toGroupServiceId(overrides.id ?? 'test-group-service-id'),
    roles: overrides.roles ?? [makeGroupServiceRole()],
  })
}

// Group Service Role Factory

export const makeGroupServiceRole = (
  overrides: Partial<{
    description: string
    id: string
    identityProviders: string[]
    isEnabled: boolean
    name: string
  }> = {},
): GroupServiceRole => {
  return new GroupServiceRole({
    description: overrides.description ?? 'test-group-service-role-description',
    id: toGroupServiceRoleId(overrides.id ?? 'test-group-service-role-id'),
    identityProviders: overrides.identityProviders ?? [
      'test-group-service-role-identity-provider',
    ],
    isEnabled: overrides.isEnabled ?? false,
    name: overrides.name ?? 'test-group-service-role-name',
  })
}

export const makeGroupServiceRoleApiData = (): GroupServiceRoleApiData => {
  return {
    allowedIdentityProviders: ['idir'],
    description: 'test-group-service-role-description',
    enabled: false,
    id: toGroupServiceRoleId('test-group-service-role-id'),
    name: 'test-group-service-role-name',
  }
}

// GroupUser Factory

export const makeGroupUser = (
  overrides: Partial<{
    id: string
    user: User
  }> = {},
): GroupUser => {
  return new GroupUser({
    id: toGroupUserId(overrides.id ?? 'test-group-user-id'),
    user: overrides.user ?? makeUser(),
  })
}

export const makeGroupUserApiData = (): GroupUserApiData => {
  return {
    id: toGroupUserId('api-group-user-id'),
    user: makeUserApiData(),
  }
}

// Role Factories

export const makeRole = (
  overrides: Partial<{
    description: string
    id: string
    name: string
  }> = {},
): Role => {
  return new Role({
    description: overrides.description ?? 'test-role-description',
    id: toRoleId(overrides.id ?? 'test-role-id'),
    name: overrides.name ?? 'test-role-name',
  })
}

export const makeRoleOperationsAdmin = (): Role => {
  return makeRole({
    description: ROLES.OPERATIONS_ADMIN.title,
    name: ROLES.OPERATIONS_ADMIN.value,
  })
}

export const makeRoleServiceUser = (): Role => {
  return makeRole({
    description: ROLES.SERVICE_USER.title,
    name: ROLES.SERVICE_USER.value,
  })
}

export const makeRoleTenantOwner = (): Role => {
  return makeRole({
    description: ROLES.TENANT_OWNER.title,
    name: ROLES.TENANT_OWNER.value,
  })
}

export const makeRoleUserAdmin = (): Role => {
  return makeRole({
    description: ROLES.USER_ADMIN.title,
    name: ROLES.USER_ADMIN.value,
  })
}

export const makeRoleApiData = (): RoleApiData => {
  return {
    description: 'api-role-description',
    id: toRoleId('api-role-id'),
    name: 'api-role-name',
  }
}

// Service Factory

export const makeService = (
  overrides: Partial<{
    clientIdentifier: string
    createdDate: string
    description: string
    displayName: string
    id: string
    landingPageUrl: string
    name: string
    roles: ServiceRole[]
    updatedDate: string
  }> = {},
): Service => {
  return new Service({
    clientIdentifier:
      overrides.clientIdentifier ?? 'test-service-client-identifier',
    createdDate: overrides.createdDate ?? 'test-service-created-date',
    description: overrides.description ?? 'test-service-description',
    displayName: overrides.displayName ?? 'test-service-display-name',
    id: toServiceId(overrides.id ?? 'test-service-id'),
    landingPageUrl: overrides.landingPageUrl ?? 'test-service-landing-page-url',
    name: overrides.name ?? 'test-service-name',
    roles: overrides.roles ?? [makeServiceRole()],
    updatedDate: overrides.updatedDate ?? 'test-service-updated-date',
  })
}

// Service Role Factory

export const makeServiceRole = (
  overrides: Partial<{
    identityProviders: string[]
    createdBy: string
    createdDate: string
    description: string
    id: string
    isDeleted: boolean
    name: string
  }> = {},
): ServiceRole => {
  return new ServiceRole({
    createdBy: overrides.createdBy ?? 'test-service-created-by',
    createdDate: overrides.createdDate ?? 'test-service-created-date',
    description: overrides.description ?? 'test-service-role-description',
    id: toServiceRoleId(overrides.id ?? 'test-service-role-id'),
    identityProviders: overrides.identityProviders ?? [
      'test-service-role-identity-provider',
    ],
    isDeleted: overrides.isDeleted ?? false,
    name: overrides.name ?? 'test-service-role-name',
  })
}

export const makeServiceRoleApiData = (): ServiceRoleApiData => {
  return {
    allowedIdentityProviders: [],
    createdBy: 'service-role-created-by',
    createdDateTime: 'service-role-created-date-time',
    description: 'service-role-description',
    id: toServiceRoleId('service-role-id'),
    isDeleted: true,
    name: 'service-role-name',
  }
}

// SsoUser Factory

export const makeSsoUser = (
  overrides: Partial<{
    displayName: string
    email: string
    firstName: string
    idpType: string
    lastName: string
    ssoUserId: string
    userName: string
  }> = {},
): SsoUser => {
  return new SsoUser({
    displayName: overrides.displayName ?? 'test-sso-user-display-name',
    email: overrides.email ?? 'test-sso-user-email',
    firstName: overrides.firstName ?? 'test-sso-user-first-name',
    idpType: overrides.idpType ?? 'test-sso-user-idp-type',
    lastName: overrides.lastName ?? 'test-sso-user-last-name',
    ssoUserId: toSsoUserId(overrides.ssoUserId ?? 'test-sso-user-id'),
    userName: overrides.userName ?? 'test-sso-user-user-name',
  })
}

export const makeSsoUserApiData = (): SsoUserApiData => {
  return {
    displayName: 'api-sso-user-display-name',
    email: 'api-sso-user-email',
    firstName: 'api-sso-user-first-name',
    idpType: 'api-sso-user-idp-type',
    lastName: 'api-sso-user-last-name',
    ssoUserId: toSsoUserId('api-sso-user-id'),
    userName: 'api-sso-user-user-name',
  }
}

// Tenant Factory

export const makeTenant = (
  overrides: Partial<{
    createdBy: string
    createdDate: string
    description: string
    id: string
    ministryName: string
    name: string
    users: User[]
  }> = {},
): Tenant => {
  return new Tenant({
    createdBy: overrides.createdBy ?? 'test-tenant-created-by',
    createdDate: overrides.createdDate ?? 'test-tenant-created-date',
    description: overrides.description ?? 'test-tenant-description',
    id: toTenantId(overrides.id ?? 'test-tenant-id'),
    ministryName: overrides.ministryName ?? 'test-tenant-ministry-name',
    name: overrides.name ?? 'test-tenant-name',
    users: overrides.users ?? [makeUser()],
  })
}

// Tenant Request Factory

export const makeTenantRequest = (
  overrides: Partial<{
    createdBy: string
    createdDate: string
    description: string
    id: string
    ministryName: string
    name: string
    rejectionReason: string
    status: string
  }> = {},
): TenantRequest => {
  return new TenantRequest({
    createdBy: overrides.createdBy ?? 'test-tenant-request-created-by',
    createdDate: overrides.createdDate ?? 'test-tenant-request-created-date',
    description: overrides.description ?? 'test-tenant-request-description',
    id: toTenantRequestId(overrides.id ?? 'test-tenant-request-id'),
    ministryName: overrides.ministryName ?? 'test-tenant-request-ministry-name',
    name: overrides.name ?? 'test-tenant-request-name',
    rejectionReason:
      overrides.rejectionReason ?? 'test-tenant-request-rejection-reason',
    status: overrides.status ?? 'test-tenant-request-status',
  })
}

// User Factories

export const makeUser = (
  overrides: Partial<{
    id: string
    roles: Role[]
    ssoUser: SsoUser
  }> = {},
): User => {
  return new User({
    id: toUserId(overrides.id ?? 'test-user-id'),
    roles: overrides.roles ?? [],
    ssoUser: overrides.ssoUser ?? makeSsoUser(),
  })
}

export const makeUserBceidBusiness = (): User => {
  return makeUser({ ssoUser: makeSsoUser({ idpType: 'bceidbusiness' }) })
}

export const makeUserIdir = (): User => {
  return makeUser({ ssoUser: makeSsoUser({ idpType: 'idir' }) })
}

export const makeUserOperationsAdmin = (): User => {
  return makeUser({ roles: [makeRoleOperationsAdmin()] })
}

export const makeUserApiData = (): UserApiData => {
  return {
    id: toUserId('api-user-id'),
    ssoUser: makeSsoUserApiData(),
  }
}
