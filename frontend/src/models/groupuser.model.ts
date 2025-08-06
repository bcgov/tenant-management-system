import { User } from '@/models'

export class GroupUser {
  id: string
  user: User

  constructor(id: string, user: User) {
    this.id = id
    this.user = user
  }

  static fromApiData(apiData: { id: string; user: User }): GroupUser {
    const user = User.fromApiData(apiData.user)

    return new GroupUser(apiData.id, user)
  }
}
