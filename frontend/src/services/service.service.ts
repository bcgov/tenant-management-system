import { DuplicateEntityError } from '@/errors/domain/DuplicateEntityError'
import { ValidationError } from '@/errors/domain/ValidationError'
import { type GroupServiceApiData } from '@/mappers/groupservice.mapper'
import { type ServiceApiData } from '@/mappers/service.mapper'
import { type GroupId } from '@/models/group.model'
import { type GroupService } from '@/models/groupservice.model'
import {
  type ServiceDetailFields,
  type ServiceId,
} from '@/models/service.model'
import { type TenantId } from '@/models/tenant.model'
import { authenticatedAxios } from '@/services/authenticated.axios'
import {
  isDuplicateEntityError,
  isValidationError,
  logApiError,
} from '@/services/utils'

const api = authenticatedAxios()

export const serviceService = {
  /**
   * Adds an existing service to a tenant.
   *
   * @param tenantId - The unique identifier of the tenant.
   * @param serviceId - The unique identifier of the service.
   * @throws Will throw an error if the API request fails.
   */
  async addServiceToTenant(
    tenantId: TenantId,
    serviceId: ServiceId,
  ): Promise<void> {
    try {
      const requestBody = {
        sharedServiceId: serviceId,
      }

      const response = await api.post(
        `/tenants/${tenantId}/shared-services`,
        requestBody,
      )

      return response.data.data
    } catch (error) {
      logApiError('Error adding service to tenant', error)

      throw error
    }
  },

  /**
   * Creates a new service with the specified details and user.
   *
   * @param serviceDetails - The details of the service to create.
   * @throws Will throw an error if the API request fails.
   */
  async createService(
    serviceDetails: ServiceDetailFields,
  ): Promise<ServiceApiData> {
    try {
      const roles = []
      for (const role of serviceDetails.roles) {
        roles.push({
          description: role.description,
          allowedIdentityProviders: role.identityProviders,
          name: role.name,
        })
      }

      const requestBody = {
        clientIdentifier: serviceDetails.clientIdentifier,
        description: serviceDetails.description,
        displayName: serviceDetails.displayName,
        landingPageUrl: serviceDetails.landingPageUrl,
        name: serviceDetails.name,
        roles: roles,
      }

      const response = await api.post(`/shared-services`, requestBody)

      return response.data.data.sharedService
    } catch (error: unknown) {
      logApiError('Error creating service', error)

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
   * Retrieves the active services.
   *
   * @throws Will throw an error if the API request fails.
   */
  async getServices(): Promise<ServiceApiData[]> {
    try {
      const response = await api.get('/shared-services')

      return response.data.data.sharedServices
    } catch (error) {
      logApiError('Error getting services', error)

      throw error
    }
  },

  /**
   * Retrieves all services associated with a group.
   *
   * @param tenantId - The unique identifier of the tenant.
   * @param groupId - The unique identifier of the group.
   * @throws Will throw an error if the API request fails.
   */
  async getTenantGroupServices(
    tenantId: TenantId,
    groupId: GroupId,
  ): Promise<GroupServiceApiData[]> {
    try {
      const response = await api.get(
        `/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`,
      )

      return response.data.data.sharedServices
    } catch (error) {
      logApiError('Error getting tenant group services', error)

      throw error
    }
  },

  /**
   * Retrieves the services associated with a tenant.
   *
   * @param tenantId - The unique identifier of the tenant.
   * @throws Will throw an error if the API request fails.
   */
  async getTenantServices(tenantId: TenantId): Promise<ServiceApiData[]> {
    try {
      const response = await api.get(`/tenants/${tenantId}/shared-services`)

      return response.data.data.sharedServices
    } catch (error) {
      logApiError('Error getting tenant services', error)

      throw error
    }
  },

  /**
   * Updates the roles for a group within a tenant.
   *
   * @param tenantId the ID of the tenant being updated.
   * @param groupId the ID of the group being updated.
   * @param data the group roles that are being updated.
   */
  async updateTenantGroupServiceRoles(
    tenantId: TenantId,
    groupId: GroupId,
    groupServices: GroupService[],
  ): Promise<ServiceApiData[]> {
    try {
      const payload = {
        sharedServices: groupServices.map((service) => ({
          id: service.id,
          sharedServiceRoles: service.roles.map((role) => ({
            id: role.id,
            enabled: role.isEnabled === true,
          })),
        })),
      }

      const response = await api.put(
        `/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`,
        payload,
      )

      return response.data.data
    } catch (error) {
      logApiError('Error updating tenant group service roles', error)

      throw error
    }
  },
}
