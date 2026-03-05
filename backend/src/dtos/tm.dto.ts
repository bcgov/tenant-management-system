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
