import { type GroupId } from '@/models/group.model'
import { type GroupServiceRole } from '@/models/groupservicerole.model'
import { type ServiceApiData, type ServiceId } from '@/models/service.model'
import { type TenantId } from '@/models/tenant.model'
import { authenticatedAxios } from '@/services/authenticated.axios'
import { logApiError } from '@/services/utils'

const api = authenticatedAxios()

export const serviceService = {
  /**
   * Retrieves all active connected services.
   *
   * @returns A promise that resolves to an array of service data.
   * @throws Will throw an error if the API request fails.
   */
  async getAllSharedServices(): Promise<ServiceApiData[]> {
    try {
      const response = await api.get('/shared-services')

      return response.data.data.sharedServices
    } catch (error) {
      logApiError('Error getting all connected services', error)

      throw error
    }
  },

  /**
   * Adds an existing connected service with a tenant.
   *
   * @param tenantId - The unique identifier of the tenant.
   * @param serviceId - The unique identifier of the connected service.
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
      logApiError('Error adding connected service to tenant', error)

      throw error
    }
  },

  /**
   * Retrieves all connected services associated with a specific tenant.
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
      logApiError('Error getting tenant connected services', error)

      throw error
    }
  },

  /**
   * Retrieves all connected services associated with a group.
   *
   * @param tenantId - The unique identifier of the tenant.
   * @param groupId - The unique identifier of the group.
   * @returns A promise that resolves to an array of service data.
   * @throws Will throw an error if the API request fails.
   */
  async getTenantGroupServices(tenantId: TenantId, groupId: GroupId) {
    // TODO: return type is Promise<ServiceApiData[]>
    try {
      const response = await api.get(
        `/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`,
      )

      return response.data.data.sharedServices
    } catch (error) {
      logApiError('Error getting tenant connected services', error)

      throw error
    }
  },

  async updateTenantGroupServices(
    tenantId: TenantId,
    groupId: GroupId,
    data: GroupServiceRole,
  ): Promise<ServiceApiData[]> {
    try {
      const response = await api.put(
        `/tenants/${tenantId}/groups/${groupId}/shared-services/shared-service-roles`,
        data,
      )

      return response.data.data
    } catch (error) {
      logApiError('Error updating connected services to group', error)

      throw error
    }
  },
}
