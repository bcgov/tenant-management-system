import type { GroupApiData } from '@/mappers/group.mapper'
import type { GroupServiceApiData } from '@/mappers/groupservice.mapper'
import { type GroupServiceRoleApiData } from '@/mappers/groupservicerole.mapper'
import { type GroupUserApiData } from '@/mappers/groupuser.mapper'
import { type RoleApiData } from '@/mappers/role.mapper'
import type { ServiceApiData } from '@/mappers/service.mapper'
import { type ServiceRoleApiData } from '@/mappers/servicerole.mapper'
import { type SsoUserApiData } from '@/mappers/ssouser.mapper'
import { type TenantApiData } from '@/mappers/tenant.mapper'
import { type TenantRequestApiData } from '@/mappers/tenantrequest.mapper'
import { type UserApiData, type UserSearchApiData } from '@/mappers/user.mapper'
import { Group, toGroupId } from '@/models/group.model'
import { GroupService, toGroupServiceId } from '@/models/groupservice.model'
import {
  GroupServiceRole,
  toGroupServiceRoleId,
} from '@/models/groupservicerole.model'
import { GroupUser, toGroupUserId } from '@/models/groupuser.model'
import { Role, toRoleId } from '@/models/role.model'
import {
  Service,
  type ServiceDetailFields,
  toServiceId,
} from '@/models/service.model'
import { ServiceRole, toServiceRoleId } from '@/models/servicerole.model'
import { SsoUser, toSsoUserId } from '@/models/ssouser.model'
import { Tenant, toTenantId } from '@/models/tenant.model'
import {
  TenantRequest,
  type TenantRequestDetailFields,
  toTenantRequestId,
} from '@/models/tenantrequest.model'
import { toUserId, User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

// Group Factory

export const makeGroup = (overrides: Partial<Group> = {}): Group => {
  return new Group({
    createdBy: overrides.createdBy ?? 'test-group-created-by',
    createdDate: overrides.createdDate ?? 'test-group-created-date',
    description: overrides.description ?? 'test-group-description',
    groupUsers: overrides.groupUsers ?? [makeGroupUser()],
    id: overrides.id ?? toGroupId('test-group-id'),
    name: overrides.name ?? 'test-group-name',
  })
}

export const makeGroupApiData = (
  overrides: Partial<GroupApiData> = {},
): GroupApiData => {
  return {
    createdBy: overrides.createdBy ?? 'api-group-created-by',
    createdDateTime: overrides.createdDateTime ?? 'api-group-created-date-time',
    description: overrides.description ?? 'api-group-description',
    id: overrides.id ?? toGroupId('api-group-id'),
    name: overrides.name ?? 'api-group-name',
    users: overrides.users ?? [makeGroupUserApiData()],
  }
}

// Group Service Factory

export const makeGroupService = (
  overrides: Partial<GroupService> = {},
): GroupService => {
  return new GroupService({
    clientIdentifier:
      overrides.clientIdentifier ?? 'test-group-service-client-identifier',
    description: overrides.description ?? 'test-group-service-description',
    displayName: overrides.displayName ?? 'test-group-service-display-name',
    id: overrides.id ?? toGroupServiceId('test-group-service-id'),
    roles: overrides.roles ?? [makeGroupServiceRole()],
  })
}

export const makeGroupServiceApiData = (
  overrides: Partial<GroupServiceApiData> = {},
): GroupServiceApiData => {
  return {
    clientIdentifier:
      overrides.clientIdentifier ?? 'api-group-service-client-identifier',
    description: overrides.description ?? 'api-group-service-description',
    displayName: overrides.displayName ?? 'api-group-service-display-name',
    id: overrides.id ?? toGroupServiceId('api-group-service-id'),
    sharedServiceRoles: overrides.sharedServiceRoles ?? [
      makeGroupServiceRoleApiData(),
    ],
  }
}

// Group Service Role Factory

export const makeGroupServiceRole = (
  overrides: Partial<GroupServiceRole> = {},
): GroupServiceRole => {
  return new GroupServiceRole({
    description: overrides.description ?? 'test-group-service-role-description',
    id: overrides.id ?? toGroupServiceRoleId('test-group-service-role-id'),
    identityProviders: overrides.identityProviders ?? [
      'test-group-service-role-identity-provider',
    ],
    isEnabled: overrides.isEnabled ?? true,
    name: overrides.name ?? 'test-group-service-role-name',
  })
}

export const makeGroupServiceRoleApiData = (
  overrides: Partial<GroupServiceRoleApiData> = {},
): GroupServiceRoleApiData => {
  return {
    allowedIdentityProviders: overrides.allowedIdentityProviders ?? [
      'api-group-service-role-identity-provider',
    ],
    description: overrides.description ?? 'api-group-service-role-description',
    enabled: overrides.enabled ?? true,
    id: overrides.id ?? toGroupServiceRoleId('api-group-service-role-id'),
    name: overrides.name ?? 'api-group-service-role-name',
  }
}

// GroupUser Factory

export const makeGroupUser = (
  overrides: Partial<GroupUser> = {},
): GroupUser => {
  return new GroupUser({
    id: overrides.id ?? toGroupUserId('test-group-user-id'),
    user: overrides.user ?? makeUser(),
  })
}

export const makeGroupUserApiData = (
  overrides: Partial<GroupUserApiData> = {},
): GroupUserApiData => {
  return {
    id: overrides.id ?? toGroupUserId('api-group-user-id'),
    user: overrides.user ?? makeUserApiData(),
  }
}

// Role Factories

export const makeRole = (overrides: Partial<Role> = {}): Role => {
  return new Role({
    description: overrides.description ?? 'test-role-description',
    id: overrides.id ?? toRoleId('test-role-id'),
    name: overrides.name ?? 'test-role-name',
  })
}

export const makeRoleApiData = (
  overrides: Partial<RoleApiData> = {},
): RoleApiData => {
  return {
    description: overrides.description ?? 'api-role-description',
    id: overrides.id ?? toRoleId('api-role-id'),
    name: overrides.name ?? 'api-role-name',
  }
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

// Service Factory

export const makeService = (overrides: Partial<Service> = {}): Service => {
  return new Service({
    clientIdentifier:
      overrides.clientIdentifier ?? 'test-service-client-identifier',
    createdDate: overrides.createdDate ?? 'test-service-created-date',
    description: overrides.description ?? 'test-service-description',
    displayName: overrides.displayName ?? 'test-service-display-name',
    id: overrides.id ?? toServiceId('test-service-id'),
    landingPageUrl: overrides.landingPageUrl ?? 'test-service-landing-page-url',
    name: overrides.name ?? 'test-service-name',
    roles: overrides.roles ?? [makeServiceRole()],
    updatedDate: overrides.updatedDate ?? 'test-service-updated-date',
  })
}

export const makeServiceApiData = (
  overrides: Partial<ServiceApiData> = {},
): ServiceApiData => {
  return {
    clientIdentifier:
      overrides.clientIdentifier ?? 'api-service-client-identifier',
    createdDateTime:
      overrides.createdDateTime ?? 'api-service-created-date-time',
    description: overrides.description ?? 'api-service-description',
    displayName: overrides.displayName ?? 'api-service-display-name',
    id: overrides.id ?? toServiceId('api-service-id'),
    landingPageUrl: overrides.landingPageUrl ?? 'api-service-landing-page-url',
    name: overrides.name ?? 'api-service-name',
    roles: overrides.roles ?? [makeServiceRoleApiData()],
    updatedDateTime:
      overrides.updatedDateTime ?? 'api-service-updated-date-time',
  }
}

export const makeServiceDetailFields = (
  overrides: Partial<ServiceDetailFields> = {},
): ServiceDetailFields => {
  return {
    clientIdentifier:
      overrides.clientIdentifier ?? 'test-service-client-identifier',
    description: overrides.description ?? 'test-service-description',
    displayName: overrides.displayName ?? 'test-service-display-name',
    landingPageUrl: overrides.landingPageUrl ?? 'test-service-landing-page-url',
    name: overrides.name ?? 'test-service-name',
    roles: overrides.roles ?? [makeServiceRole()],
  }
}

// Service Role Factory

export const makeServiceRole = (
  overrides: Partial<ServiceRole> = {},
): ServiceRole => {
  return new ServiceRole({
    createdBy: overrides.createdBy ?? 'test-service-role-created-by',
    createdDate: overrides.createdDate ?? 'test-service-role-created-date',
    description: overrides.description ?? 'test-service-role-description',
    id: overrides.id ?? toServiceRoleId('test-service-role-id'),
    identityProviders: overrides.identityProviders ?? [
      'test-service-role-identity-provider',
    ],
    isDeleted: overrides.isDeleted ?? true,
    name: overrides.name ?? 'test-service-role-name',
  })
}

export const makeServiceRoleApiData = (
  overrides: Partial<ServiceRoleApiData> = {},
): ServiceRoleApiData => {
  return {
    allowedIdentityProviders: overrides.allowedIdentityProviders ?? [
      'api-service-role-allowed-identity-provider',
    ],
    createdBy: overrides.createdBy ?? 'api-service-role-created-by',
    createdDateTime:
      overrides.createdDateTime ?? 'api-service-role-created-date-time',
    description: overrides.description ?? 'api-service-role-description',
    id: overrides.id ?? toServiceRoleId('api-service-role-id'),
    isDeleted: overrides.isDeleted ?? true,
    name: overrides.name ?? 'api-service-role-name',
  }
}

// SsoUser Factory

export const makeSsoUser = (overrides: Partial<SsoUser> = {}): SsoUser => {
  return new SsoUser({
    displayName: overrides.displayName ?? 'test-sso-user-display-name',
    email: overrides.email ?? 'test-sso-user-email',
    firstName: overrides.firstName ?? 'test-sso-user-first-name',
    idpType: overrides.idpType ?? 'test-sso-user-idp-type',
    lastName: overrides.lastName ?? 'test-sso-user-last-name',
    ssoUserId: overrides.ssoUserId ?? toSsoUserId('test-sso-user-sso-user-id'),
    userName: overrides.userName ?? 'test-sso-user-user-name',
  })
}

export const makeSsoUserApiData = (
  overrides: Partial<SsoUserApiData> = {},
): SsoUserApiData => {
  return {
    displayName: overrides.displayName ?? 'api-sso-user-display-name',
    email: overrides.email ?? 'api-sso-user-email',
    firstName: overrides.firstName ?? 'api-sso-user-first-name',
    idpType: overrides.idpType ?? 'api-sso-user-idp-type',
    lastName: overrides.lastName ?? 'api-sso-user-last-name',
    ssoUserId: overrides.ssoUserId ?? toSsoUserId('api-sso-user-sso-user-id'),
    userName: overrides.userName ?? 'api-sso-user-user-name',
  }
}

// Tenant Factory

export const makeTenant = (overrides: Partial<Tenant> = {}): Tenant => {
  return new Tenant({
    createdBy: overrides.createdBy ?? 'test-tenant-created-by',
    createdDate: overrides.createdDate ?? 'test-tenant-created-date',
    description: overrides.description ?? 'test-tenant-description',
    id: overrides.id ?? toTenantId('test-tenant-id'),
    ministryName: overrides.ministryName ?? 'test-tenant-ministry-name',
    name: overrides.name ?? 'test-tenant-name',
    users: overrides.users ?? [makeUser()],
  })
}

export const makeTenantApiData = (
  overrides: Partial<TenantApiData> = {},
): TenantApiData => {
  return {
    createdBy: overrides.createdBy ?? 'api-tenant-created-by',
    createdDateTime:
      overrides.createdDateTime ?? 'api-tenant-created-date-time',
    description: overrides.description ?? 'api-tenant-description',
    id: overrides.id ?? toTenantId('api-tenant-id'),
    ministryName: overrides.ministryName ?? 'api-tenant-ministry-name',
    name: overrides.name ?? 'api-tenant-name',
    users: overrides.users ?? [makeUserApiData()],
  }
}

// Tenant Request Factory

export const makeTenantRequest = (
  overrides: Partial<TenantRequest> = {},
): TenantRequest => {
  return new TenantRequest({
    createdBy: overrides.createdBy ?? 'test-tenant-request-created-by',
    createdDate: overrides.createdDate ?? 'test-tenant-request-created-date',
    description: overrides.description ?? 'test-tenant-request-description',
    id: overrides.id ?? toTenantRequestId('test-tenant-request-id'),
    ministryName: overrides.ministryName ?? 'test-tenant-request-ministry-name',
    name: overrides.name ?? 'test-tenant-request-name',
    rejectionReason:
      overrides.rejectionReason ?? 'test-tenant-request-rejection-reason',
    status: overrides.status ?? 'test-tenant-request-status',
  })
}

export const makeTenantRequestApiData = (
  overrides: Partial<TenantRequestApiData> = {},
): TenantRequestApiData => {
  return {
    createdBy: overrides.createdBy ?? 'api-tenant-request-created-by',
    createdDateTime:
      overrides.createdDateTime ?? 'api-tenant-request-created-date-time',
    description: overrides.description ?? 'api-tenant-request-description',
    id: overrides.id ?? toTenantRequestId('api-tenant-request-id'),
    ministryName: overrides.ministryName ?? 'api-tenant-request-ministry-name',
    name: overrides.name ?? 'api-tenant-request-name',
    rejectionReason:
      overrides.rejectionReason ?? 'api-tenant-request-rejection-reason',
    status: overrides.status ?? 'api-tenant-request-status',
  }
}

export const makeTenantRequestDetails = (
  overrides: Partial<TenantRequestDetailFields> = {},
): TenantRequestDetailFields => {
  return {
    description: overrides.description ?? 'test-tenant-request-description',
    ministryName: overrides.ministryName ?? 'test-tenant-request-ministry-name',
    name: overrides.name ?? 'test-tenant-request-name',
  }
}

// User Factories

export const makeUser = (overrides: Partial<User> = {}): User => {
  return new User({
    id: overrides.id ?? toUserId('test-user-id'),
    roles: overrides.roles ?? [makeRole()],
    ssoUser: overrides.ssoUser ?? makeSsoUser(),
  })
}

export const makeUserApiData = (
  overrides: Partial<UserApiData> = {},
): UserApiData => {
  return {
    id: overrides.id ?? toUserId('api-user-id'),
    roles: overrides.roles ?? [makeRoleApiData()],
    ssoUser: overrides.ssoUser ?? makeSsoUserApiData(),
  }
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

export const makeUserSearchApiData = (
  overrides: Partial<UserSearchApiData> = {},
): UserSearchApiData => {
  return {
    attributes: overrides.attributes ?? {
      'api-user-search-attribute-key': ['api-user-search-attribute-value'],
    },
    email: overrides.email ?? 'api-user-search-email',
    firstName: overrides.firstName ?? 'api-user-search-first-name',
    lastName: overrides.lastName ?? 'api-user-search-last-name',
  }
}
