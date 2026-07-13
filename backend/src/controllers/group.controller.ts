import { Request, Response } from 'express'
import { groupService } from '../services/group.service'
import { handleControllerError } from '../common/error.handler'

export class GroupController {
  public async createGroup(req: Request, res: Response) {
    try {
      const groupResponse = await groupService.createGroup(req)
      res.status(201).send(groupResponse)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred creating group')
    }
  }

  public async addGroupUser(req: Request, res: Response) {
    try {
      const groupUserResponse = await groupService.addGroupUser(req)
      res.status(201).send(groupUserResponse)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred adding user to group')
    }
  }

  public async updateGroup(req: Request, res: Response) {
    try {
      const groupResponse = await groupService.updateGroup(req)
      res.status(200).send(groupResponse)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred updating group')
    }
  }

  public async removeGroupUser(req: Request, res: Response) {
    try {
      await groupService.removeGroupUser(req)
      res.status(204).send()
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred removing user from group',
      )
    }
  }

  public async getGroup(req: Request, res: Response) {
    try {
      const groupResponse = await groupService.getGroup(req)
      res.status(200).send(groupResponse)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred getting a group')
    }
  }

  public async getTenantGroups(req: Request, res: Response) {
    try {
      const groupsResponse = await groupService.getTenantGroups(req)
      res.status(200).send(groupsResponse)
    } catch (error: unknown) {
      handleControllerError(res, error, 'Error occurred getting tenant groups')
    }
  }

  public async getSharedServiceRolesForGroup(req: Request, res: Response) {
    try {
      const sharedServiceRolesResponse =
        await groupService.getSharedServiceRolesForGroup(req)
      res.status(200).send(sharedServiceRolesResponse)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred getting shared service roles for group',
      )
    }
  }

  public async updateSharedServiceRolesForGroup(req: Request, res: Response) {
    try {
      const sharedServiceRolesResponse =
        await groupService.updateSharedServiceRolesForGroup(req)
      res.status(200).send(sharedServiceRolesResponse)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred updating shared service roles for group',
      )
    }
  }

  public async getUserGroupsWithSharedServiceRoles(
    req: Request,
    res: Response,
  ) {
    try {
      const result = await groupService.getUserGroupsWithSharedServiceRoles(req)
      res.status(200).send(result)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred getting user groups with shared services',
      )
    }
  }

  public async getEffectiveSharedServiceRoles(req: Request, res: Response) {
    try {
      const result = await groupService.getEffectiveSharedServiceRoles(req)
      res.status(200).send(result)
    } catch (error: unknown) {
      handleControllerError(
        res,
        error,
        'Error occurred getting effective shared service roles',
      )
    }
  }
}

export const groupController = new GroupController()
