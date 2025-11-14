enum SharedServiceRoleIdEnum {
  _ = '',
}
export declare type SharedServiceRoleId = string & SharedServiceRoleIdEnum

export class SharedServiceRoles {
  id: SharedServiceRoleId
  enabled: boolean

  constructor(id: string, enabled: boolean) {
    this.id = id as SharedServiceRoleId
    this.enabled = enabled
  }
}

export class SharedServicesArray {
  id: SharedServiceRoleId
  sharedServiceRoles: SharedServiceRoles[]

  constructor(id: string, sharedServiceRoles: SharedServiceRoles[]) {
    this.id = id as SharedServiceRoleId
    this.sharedServiceRoles = sharedServiceRoles
  }
}

export class GroupServiceRoles {
  sharedServices: SharedServicesArray[]
  constructor(sharedServices: SharedServicesArray[]) {
    this.sharedServices = sharedServices
  }
}
