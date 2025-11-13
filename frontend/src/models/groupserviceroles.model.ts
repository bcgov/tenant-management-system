enum SharedServiceRoleIdEnum {
  _ = '',
}
declare type SharedServiceRoleId = string & SharedServiceRoleIdEnum

enum SharedServicesArrayIdEnum {
  _ = '',
}
declare type SharedServicesArrayId = string & SharedServicesArrayIdEnum

export class SharedServiceRoles {
  id: SharedServiceRoleId
  enabled: boolean

  constructor(id: string, enabled: boolean) {
    this.id = id as SharedServiceRoleId
    this.enabled = enabled
  }
}

export class SharedServicesArray {
  id: SharedServicesArrayId
  sharedServiceRoles: SharedServiceRoles[]

  constructor(id: string, sharedServiceRoles: SharedServiceRoles[]) {
    this.id = id as SharedServicesArrayId
    this.sharedServiceRoles = sharedServiceRoles
  }
}

export class GroupServiceRoles {
  sharedServices: SharedServicesArray[]
  constructor(sharedServices: SharedServicesArray[]) {
    this.sharedServices = sharedServices
  }
}
