export class Role {
  description: string
  id: string
  name: string

  constructor(id: string, name: string, description: string) {
    this.description = description
    this.id = id
    this.name = name
  }

  static fromApiData(apiData: {
    description: string
    id: string
    name: string
  }): Role {
    return new Role(apiData.id, apiData.name, apiData.description)
  }
}
