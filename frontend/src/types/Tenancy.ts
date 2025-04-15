import type { User } from '@/types/User'

// TODO make this into a class

export type Tenancy = {
  // TODO: what's the PRNG for this and should be use something else?
  id: string
  name: string
  ministryName: string
  // TODO: this type should not have both User and User[]
  user: User
  users: User[]
}
