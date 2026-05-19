import { type GroupId } from '@/models/group.model'
import {
  type GroupService,
  type GroupServiceApiData,
} from '@/models/groupservice.model'
import { type ServiceApiData, type ServiceId } from '@/models/service.model'
import { type TenantId } from '@/models/tenant.model'
import { authenticatedAxios } from '@/services/authenticated.axios'
import { logApiError } from '@/services/utils'

const api = authenticatedAxios()

export const serviceService = {
  /**
   * Adds an existing service to a tenant.
   *
   * @param tenantId - The unique identifier of the tenant.
   * @param serviceId - The unique identifier of the service.
   * @returns A promise that resolves when the request succeeds.
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
   * Retrieves the active services.
   *
   * @returns A promise that resolves to an array of service data.
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
   * @returns A promise that resolves to an array of service data.
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
   * @returns A promise that resolves to an array of service data.
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
