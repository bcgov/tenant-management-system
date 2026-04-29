export type SharedServiceRoleId = string & {
  readonly __brand: 'SharedServiceRoleId'
}

export class SharedServiceRole {
  id: SharedServiceRoleId
  enabled: boolean

  constructor(id: SharedServiceRoleId, enabled: boolean) {
    this.id = id
    this.enabled = enabled
  }
}

export class SharedServiceArray {
  id: SharedServiceRoleId
  sharedServiceRoles: SharedServiceRole[]

  constructor(
    id: SharedServiceRoleId,
    sharedServiceRoles: SharedServiceRole[],
  ) {
    this.id = id
    this.sharedServiceRoles = sharedServiceRoles
  }
}
