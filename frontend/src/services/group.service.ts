import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ValidationError } from '@/errors/domain/ValidationError'
import { type GroupApiData, type GroupId } from '@/models/group.model'
import {
  type GroupUserApiData,
  type GroupUserId,
} from '@/models/groupuser.model'
import { type TenantId } from '@/models/tenant.model'
import { User } from '@/models/user.model'
import { authenticatedAxios } from '@/services/authenticated.axios'
import {
  isDuplicateEntityError,
  isValidationError,
  logApiError,
} from '@/services/utils'

const api = authenticatedAxios()

export const groupService = {
  /**
   * Adds a user to an existing group within a tenant.
   *
   * @param tenantId - The ID of the tenant.
   * @param groupId - The ID of the group to add the user to.
   * @param user - The user to add to the group.
   * @returns A promise that resolves to the group user data.
   * @throws Will throw an error if the API request fails.
   */
  async addUserToGroup(
    tenantId: TenantId,
    groupId: GroupId,
    user: User,
  ): Promise<GroupUserApiData> {
    try {
      const requestBody = {
        user: {
          displayName: user.ssoUser.displayName,
          email: user.ssoUser.email,
          firstName: user.ssoUser.firstName,
          lastName: user.ssoUser.lastName,
          ssoUserId: user.ssoUser.ssoUserId,
          userName: user.ssoUser.userName,
        },
      }

      const response = await api.post(
        `/tenants/${tenantId}/groups/${groupId}/users`,
        requestBody,
      )

      return response.data.data.groupUser
    } catch (error: unknown) {
      logApiError('Error adding user to group', error)

      // Handle HTTP 400 Bad Request (validation)
      if (isValidationError(error)) {
        const messageArray = error.response.data.details.body.map(
          (item: { message: string }) => item.message,
        )

        throw new ValidationError(messageArray)
      }

      // Handle HTTP 409 Conflict (duplicate)
      if (isDuplicateEntityError(error)) {
        throw new DuplicateEntityError(error.response.data.message)
      }

      // Re-throw all other errors
      throw error
    }
  },

  /**
   * Creates a new group with the specified name and description.
   *
   * @param tenantId - The ID of the tenant that the group is created for.
   * @param name - The name of the group to create.
   * @param description - The description of the group.
   * @returns A promise that resolves to the group data.
   * @throws Will throw an error if the API request fails.
   */
  async createGroup(
    tenantId: TenantId,
    name: string,
    description: string,
  ): Promise<GroupApiData> {
    try {
      const requestBody = {
        description,
        name,
      }

      const response = await api.post(
        `/tenants/${tenantId}/groups`,
        requestBody,
      )

      return response.data.data.group
    } catch (error: unknown) {
      logApiError('Error creating group', error)

      // Handle HTTP 400 Bad Request (validation)
      if (isValidationError(error)) {
        const messageArray = error.response.data.details.body.map(
          (item: { message: string }) => item.message,
        )

        throw new ValidationError(messageArray)
      }

      // Handle HTTP 409 Conflict (duplicate)
      if (isDuplicateEntityError(error)) {
        throw new DuplicateEntityError(error.response.data.message)
      }

      // Re-throw all other errors
      throw error
    }
  },

  /**
   * Retrieves the specified group for a tenant.
   *
   * @param tenantId - The ID of the tenant.
   * @param groupId - The ID of the group within the tenant.
   * @returns A promise that resolves to the group data.
   * @throws Will throw an error if the API request fails.
   */
  async getGroup(tenantId: TenantId, groupId: GroupId): Promise<GroupApiData> {
    try {
      const response = await api.get(
        `/tenants/${tenantId}/groups/${groupId}?expand=groupUsers`,
      )

      return response.data.data.group
    } catch (error) {
      logApiError('Error getting group', error)

      throw error
    }
  },

  /**
   * Retrieves the groups associated with the specified tenant.
   *
   * @param tenantId - The ID of the tenant.
   * @returns A promise that resolves to an array of group data.
   * @throws Will throw an error if the API request fails.
   */
  async getTenantGroups(tenantId: TenantId): Promise<GroupApiData[]> {
    try {
      const response = await api.get(`/tenants/${tenantId}/groups`)

      return response.data.data.groups
    } catch (error) {
      logApiError('Error getting tenant groups', error)

      throw error
    }
  },

  /**
   * Removes a user from an existing group within a tenant.
   *
   * @param tenantId - The ID of the tenant.
   * @param groupId - The ID of the group to remove the user from.
   * @param groupUserId - The ID of the group user to remove.
   * @returns A promise that resolves when the request succeeds.
   * @throws Will throw an error if the API request fails.
   */
  async removeUserFromGroup(
    tenantId: TenantId,
    groupId: GroupId,
    groupUserId: GroupUserId,
  ): Promise<void> {
    try {
      await api.delete(
        `/tenants/${tenantId}/groups/${groupId}/users/${groupUserId}`,
      )
    } catch (error: unknown) {
      logApiError('Error removing user from group', error)

      throw error
    }
  },

  /**
   * Updates an existing group with the specified details.
   *
   * @param tenantId - The ID of the tenant that the group belongs to.
   * @param groupId - The ID of the group to update.
   * @param name - The new name of the group.
   * @param description - The new description for the group.
   * @returns A promise that resolves to the group data.
   * @throws Will throw an error if the API request fails.
   */
  async updateGroup(
    tenantId: TenantId,
    groupId: GroupId,
    name: string,
    description: string,
  ): Promise<GroupApiData> {
    try {
      const requestBody = {
        description: description,
        name: name,
      }

      const response = await api.put(
        `/tenants/${tenantId}/groups/${groupId}`,
        requestBody,
      )

      return response.data.data.group
    } catch (error: unknown) {
      logApiError('Error updating group', error)

      // Handle HTTP 400 Bad Request (validation)
      if (isValidationError(error)) {
        const messageArray = error.response.data.details.body.map(
          (item: { message: string }) => item.message,
        )

        throw new ValidationError(messageArray)
      }

      // Handle HTTP 409 Conflict (duplicate)
      if (isDuplicateEntityError(error)) {
        throw new DuplicateEntityError(error.response.data.message)
      }

      // Re-throw all other errors
      throw error
    }
  },
}
