export class SsoUser {
  id: string
  displayName: string
  email: string

  constructor(id: string, displayName: string, email: string) {
    this.id = id
    this.displayName = displayName
    this.email = email
  }

  static fromApiData(apiData: {
    id: string
    displayName: string
    email: string
  }): SsoUser {
    return new SsoUser(apiData.id, apiData.displayName, apiData.email)
  }
}
