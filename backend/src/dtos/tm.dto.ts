export interface CreateGroupInputDto {
  tenantId: string
  name: string
  description?: string
  tenantUserId?: string
  createdBy: string
}

export interface UpdateGroupInputDto {
  tenantId: string
  groupId: string
  name?: string
  description?: string
  updatedBy: string
}

export interface AddGroupUserInputDto {
  tenantId: string
  groupId: string
  tenantUserId: string
  updatedBy: string
}

export interface AddGroupUserResultDto {
  id: string
  user: {
    id: string
    isDeleted: boolean
    ssoUser: unknown
    createdDateTime: Date
    updatedDateTime: Date
    createdBy: string
    updatedBy: string
    roles: unknown[]
  }
  isDeleted: boolean
  createdDateTime: Date
  updatedDateTime: Date
  createdBy: string
  updatedBy: string
}

export interface RemoveGroupUserInputDto {
  tenantId: string
  groupId: string
  groupUserId: string
  updatedBy: string
}

export interface GetGroupInputDto {
  tenantId: string
  groupId: string
  expand: string[]
}

export interface GetGroupResultDto {
  id: string
  name: string
  description?: string | null
  createdDateTime: Date
  updatedDateTime: Date
  users?: Array<{
    id: string
    isDeleted: boolean
    createdDateTime: Date
    updatedDateTime: Date
    createdBy: string
    updatedBy: string
    user: {
      id?: string
      ssoUser?: unknown
      createdDateTime?: Date
      updatedDateTime?: Date
      createdBy?: string
      updatedBy?: string
    }
  }>
}

export interface GetTenantGroupsInputDto {
  tenantId: string
  ssoUserId?: string
  jwtAudience: string
  tmsAudience: string
}

export interface GetSharedServiceRolesForGroupInputDto {
  tenantId: string
  groupId: string
}

export interface GetSharedServiceRoleForGroupResultDto {
  id: string
  name: string
  description: string | null
  enabled: boolean
  createdDateTime: Date
  createdBy: string
}

export interface GetSharedServiceForGroupResultDto {
  id: string
  name: string
  clientIdentifier: string
  description: string | null
  createdDateTime: Date
  updatedDateTime: Date
  createdBy: string
  updatedBy: string
  sharedServiceRoles: GetSharedServiceRoleForGroupResultDto[]
}

export interface UpdateSharedServiceRolesForGroupRoleInputDto {
  id: string
  enabled: boolean
}

export interface UpdateSharedServiceRolesForGroupSharedServiceInputDto {
  id: string
  sharedServiceRoles: UpdateSharedServiceRolesForGroupRoleInputDto[]
}

export interface UpdateSharedServiceRolesForGroupInputDto {
  tenantId: string
  groupId: string
  updatedBy: string
  sharedServices: UpdateSharedServiceRolesForGroupSharedServiceInputDto[]
}

export interface GetEffectiveSharedServiceRolesInputDto {
  tenantId: string
  ssoUserId: string
  audience: string
  idpType: string
}

export interface GetEffectiveSharedServiceRoleGroupResultDto {
  id: string
  name: string
}

export interface GetEffectiveSharedServiceRoleResultDto {
  id: string
  name: string
  description: string | null
  allowedIdentityProviders: string[] | null
  groups: GetEffectiveSharedServiceRoleGroupResultDto[]
}

export interface GetUserGroupsWithSharedServiceRolesInputDto {
  tenantId: string
  ssoUserId: string
  audience: string
  idpType: string
}

export interface GetUserGroupsWithSharedServiceRoleResultDto {
  id: string
  name: string
  description: string | null
  allowedIdentityProviders: string[] | null
  isDeleted: boolean
  createdDateTime: Date
  updatedDateTime: Date
  createdBy: string
  updatedBy: string
}

export interface GetUserGroupsWithSharedServiceGroupResultDto {
  id: string
  name: string
  description: string | null
  createdDateTime: Date
  updatedDateTime: Date
  sharedServiceRoles: GetUserGroupsWithSharedServiceRoleResultDto[]
}

export interface GetUserGroupsWithSharedServiceRolesResultDto {
  groups: GetUserGroupsWithSharedServiceGroupResultDto[]
}
