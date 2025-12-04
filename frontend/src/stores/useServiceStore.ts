import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Service } from '@/models'
import { serviceService } from '@/services'

/**
 * Pinia store for managing services and tenant-specific services.
 */
export const useServiceStore = defineStore('service', () => {
  const loading = ref(false)
  const services = ref<Service[]>([])

  // Private methods

  /**
   * Inserts or updates a service in the store.
   *
   * @param {Service} service - The service to insert or update.
   * @returns {Service} The inserted or updated service.
   */
  function upsertService(service: Service) {
    const index = services.value.findIndex((s) => s.id === service.id)
    if (index !== -1) {
      services.value[index] = service
    } else {
      services.value.push(service)
    }

    return service
  }

  // Exported Methods

  /**
   * Adds a service to a tenant.
   *
   * @param {string} tenantId - The ID of the tenant.
   * @param {string} serviceId - The ID of the service.
   * @returns {Promise<unknown>} The API response.
   */
  const addServiceToTenant = async (tenantId: string, serviceId: string) => {
    const apiResponse = await serviceService.addServiceToTenant(
      tenantId,
      serviceId,
    )

    return apiResponse
  }

  /**
   * Fetches all connected services from the API and updates the store.
   *
   * @returns {Promise<Service[]>} The list of services.
   */
  const fetchServices = async () => {
    loading.value = true
    try {
      const serviceList = await serviceService.getAllSharedServices()
      services.value = serviceList.map(Service.fromApiData)

      return services.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches services for a tenant from the API and updates the store.
   *
   * @param {string} tenantId - The ID of the tenant.
   * @returns {Promise<Service[]>} The list of tenant services.
   */
  const fetchTenantServices = async (tenantId: string) => {
    loading.value = true
    try {
      const serviceList = await serviceService.getTenantServices(tenantId)
      const tenantServices = serviceList.map(Service.fromApiData)

      // Update the store with these services
      tenantServices.forEach(upsertService)

      return tenantServices
    } finally {
      loading.value = false
    }
  }

  /**
   * Retrieves a service by its ID from the store.
   *
   * @param {string} serviceId - The ID of the service.
   * @returns {Service|undefined} The service if found, otherwise undefined.
   */
  function getService(serviceId: string): Service | undefined {
    return services.value.find((s) => s.id === serviceId)
  }

  return {
    loading,
    services,

    addServiceToTenant,
    fetchServices,
    fetchTenantServices,
    getService,
  }
})
