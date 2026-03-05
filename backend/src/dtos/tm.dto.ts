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
