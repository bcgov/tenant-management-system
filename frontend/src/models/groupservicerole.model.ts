import { SharedServiceArray } from '@/models/sharedservicerole.model'

export class GroupServiceRole {
  sharedServices: SharedServiceArray[]

  constructor(sharedServices: SharedServiceArray[]) {
    this.sharedServices = sharedServices
  }
}
