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

export interface CreateTenantRequestInputDto {
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

export interface UpdateTenantRequestStatusInputDto {
  requestId: string
  status: 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  tenantName?: string
  updatedBy: string
  decisionedByUser: {
    ssoUserId: string
    firstName: string
    lastName: string
    displayName: string
    userName: string
    email: string
  }
}

export interface UpdateTenantRequestTenantResultDto {
  id: string
  name: string
  ministryName: string
  description?: string
  createdBy: string
  updatedBy: string
}

export interface UpdateTenantRequestStatusResultDto {
  tenantRequest: {
    id: string
    name?: string
    ministryName?: string
    description?: string
    status: 'NEW' | 'APPROVED' | 'REJECTED'
    requestedBy?: {
      id?: string
      displayName?: string
      email?: string
    }
    decisionedBy?: {
      id?: string
      displayName?: string
      email?: string
    }
    decisionedAt?: Date
    rejectionReason?: string | null
    createdBy?: string
    updatedBy?: string
  }
  tenant?: UpdateTenantRequestTenantResultDto
}

export interface UpdateTenantRequestStatusResponseTenantRequestDto {
  id: string
  name?: string
  ministryName?: string
  description?: string
  status: 'NEW' | 'APPROVED' | 'REJECTED'
  requestedBy?: string
  decisionedBy?: string
  decisionedAt?: Date
  rejectionReason?: string | null
  createdBy?: string
  updatedBy?: string
}

export interface UpdateTenantRequestStatusResponseDto {
  data: {
    tenantRequest: UpdateTenantRequestStatusResponseTenantRequestDto
    tenant?: UpdateTenantRequestTenantResultDto
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

export interface GetTenantRequestsInputDto {
  status?: 'NEW' | 'APPROVED' | 'REJECTED'
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

export interface UnassignUserRolesInputDto {
  tenantId: string
  tenantUserId: string
  roleId: string
  updatedBy: string
}

export interface GetTenantInputDto {
  tenantId: string
  expand: string[]
}

export interface UpdateTenantInputDto {
  tenantId: string
  name?: string
  ministryName?: string
  description?: string
  updatedBy: string
}

export interface GetRolesForSsoUserInputDto {
  tenantId: string
  ssoUserId: string
}
