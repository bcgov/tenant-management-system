import type { GroupServiceRoles } from '@/models/groupserviceroles.model'
import { authenticatedAxios } from './authenticated.axios'
import { logApiError } from './utils'

const api = authenticatedAxios()

export const serviceService = {
  /**
   * Retrieves all active connected services.
   *
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   connected service objects.
   * @throws Will throw an error if the API request fails.
   */
  async getAllSharedServices() {
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
   * @param {string} tenantId - The unique identifier of the tenant.
   * @param {string} serviceId - The unique identifier of the connected service.
   * @returns {Promise<object>} A promise that resolves to the result.
   * @throws Will throw an error if the API request fails.
   */
  async addServiceToTenant(tenantId: string, serviceId: string) {
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
   * @param {string} tenantId - The unique identifier of the tenant.
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   connected service objects associated with the tenant.
   * @throws Will throw an error if the API request fails.
   */
  async getTenantServices(tenantId: string) {
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
   * @param {string} tenantId - The unique identifier of the tenant.
   * @param {string} groupId - The unique identifier of the group.
   * @returns {Promise<object[]>} A promise that resolves to an array of
   *   connected service objects associated with the tenant.
   * @throws Will throw an error if the API request fails.
   */
  async getTenantGroupServices(tenantId: string, groupId: string) {
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
    tenantId: string,
    groupId: string,
    data: GroupServiceRoles,
  ) {
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
