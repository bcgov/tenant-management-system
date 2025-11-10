export class SharedServiceRoles {
  id: string
  enabled: boolean

  constructor(id: string, enabled: boolean) {
    this.id = id
    this.enabled = enabled
  }
}

export class SharedServicesArray {
  id: string
  sharedServiceRoles: SharedServiceRoles[]

  constructor(id: string, sharedServiceRoles: SharedServiceRoles[]) {
    this.id = id
    this.sharedServiceRoles = sharedServiceRoles
  }
}

export class GroupServiceRoles {
  sharedServices: SharedServicesArray[]
  constructor(sharedServices: SharedServicesArray[]) {
    this.sharedServices = sharedServices
  }
}
