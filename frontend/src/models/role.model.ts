export class Role {
  id: string
  name: string

  constructor(id: string, name: string) {
    this.id = id
    this.name = name
  }

  static fromApiData(apiData: { id: string; name: string }): Role {
    return new Role(apiData.id, apiData.name)
  }
}
