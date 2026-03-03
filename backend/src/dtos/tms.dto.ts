import { TenantUser } from '../entities/TenantUser'
import { TenantUserRole } from '../entities/TenantUserRole'

export interface CreateTenantInputDto {
  name: string
  ministryName: string
  description?: string
  user: {
    ssoUserId: string
    firstName: string
    lastName: string
    displayName: string
    userName?: string
    email?: string
  }
}

export interface AddTenantUserInputDto {
  tenantId: string
  updatedBy: string
  user: {
    ssoUserId: string
    firstName: string
    lastName: string
    displayName: string
    userName?: string
    email?: string
    idpType?: 'idir' | 'bceidbasic' | 'bceidbusiness'
  }
  roles?: string[]
  groups?: string[]
}

export interface AddTenantUserResultDto {
  savedTenantUser: TenantUser
  roleAssignments: TenantUserRole[]
  tenantUserId: string
}

export interface RemoveTenantUserInputDto {
  tenantUserId: string
  tenantId: string
  deletedBy: string
}

export interface GetUserTenantsInputDto {
  ssoUserId: string
  expand: string[]
  jwtAudience?: string
}

export interface GetTenantUsersInputDto {
  tenantId: string
  groupIds?: string[]
  sharedServiceRoleIds?: string[]
}

export interface AssignUserRolesInputDto {
  tenantId: string
  tenantUserId: string
  roleIds: string[]
}

export interface GetTenantRolesInputDto {
  tenantId: string
}

export interface GetUserRolesInputDto {
  tenantId: string
  tenantUserId: string
}
