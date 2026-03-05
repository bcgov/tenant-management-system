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
  params: {
    tenantId: string
    groupId: string
  }
  body: {
    tenantUserId: string
  }
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
  params: {
    tenantId: string
    groupId: string
    groupUserId: string
  }
}
