import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Service, type ServiceId } from '@/models/service.model'
import { type TenantId } from '@/models/tenant.model'
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
   * @param service - The service to insert or update.
   * @returns The inserted or updated service.
   */
  function upsertService(service: Service): Service {
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
   * @returns A promise that resolves when the service is added to the tenant.
   */
  const addServiceToTenant = async (
    tenantId: TenantId,
    serviceId: ServiceId,
  ): Promise<void> => {
    await serviceService.addServiceToTenant(tenantId, serviceId)
  }

  /**
   * Fetches all connected services from the API and updates the store.
   *
   * @returns A promise that resolves to the list of all services.
   */
  const fetchServices = async (): Promise<Service[]> => {
    loading.value = true
    try {
      const services = await serviceService.getAllSharedServices()

      return services.map(Service.fromApiData)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches services for a tenant from the API and updates the store.
   *
   * @param tenantId - The ID of the tenant.
   * @returns A promise that resolves to the list of services associated with
   *   the tenant.
   */
  const fetchTenantServices = async (
    tenantId: TenantId,
  ): Promise<Service[]> => {
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
   * @returns The service if found, otherwise undefined.
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
