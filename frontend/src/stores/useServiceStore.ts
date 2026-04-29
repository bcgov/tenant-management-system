import { defineStore } from 'pinia'
import { ref } from 'vue'

import { type TenantId } from '@/models/tenant.model'
import { Service, type ServiceId } from '@/models/service.model'
import { serviceService } from '@/services/service.service'

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
    if (index === -1) {
      services.value.push(service)
    } else {
      services.value[index] = service
    }

    return service
  }

  // Exported Methods

  /**
   * Adds a service to a tenant.
   *
   * @param tenantId - The ID of the tenant.
   * @param serviceId - The ID of the service.
   * @returns {Promise<unknown>} The API response.
   */
  const addServiceToTenant = async (
    tenantId: TenantId,
    serviceId: ServiceId,
  ) => {
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
      const services = await serviceService.getAllSharedServices()
      services.value = services.map(Service.fromApiData)

      return services.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches services for a tenant from the API and updates the store.
   *
   * @param tenantId - The ID of the tenant.
   * @returns {Promise<Service[]>} The list of tenant services.
   */
  const fetchTenantServices = async (tenantId: TenantId) => {
    loading.value = true
    try {
      const services = await serviceService.getTenantServices(tenantId)
      const tenantServices = services.map(Service.fromApiData)

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
   * @param serviceId - The ID of the service.
   * @returns {Service|undefined} The service if found, otherwise undefined.
   */
  function getService(serviceId: ServiceId): Service | undefined {
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
