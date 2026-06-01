import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Service, type ServiceId } from '@/models/service.model'
import { type TenantId } from '@/models/tenant.model'
import { serviceService } from '@/services/service.service'

/**
 * Pinia store for managing services.
 */
export const useServiceStore = defineStore('service', () => {
  const loading = ref(false)
  const services = ref<Service[]>([])
  const tenantServices = ref<Service[]>([])

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
   * Fetches all services from the API and updates the store.
   *
   * @returns A promise that resolves when the API call completes.
   */
  const fetchServices = async (): Promise<void> => {
    loading.value = true
    try {
      const serviceData = await serviceService.getServices()
      const serviceObjects = serviceData.map(Service.fromApiData)

      // Update the store with these services.
      serviceObjects.forEach(upsertService)
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches tenant services for a tenant from the API and updates the store.
   *
   * @param tenantId - The ID of the tenant.
   * @returns A promise that resolves when the API call completes.
   */
  const fetchTenantServices = async (tenantId: TenantId): Promise<void> => {
    loading.value = true
    try {
      const tenantServiceData = await serviceService.getTenantServices(tenantId)
      tenantServices.value = tenantServiceData.map(Service.fromApiData)
    } finally {
      loading.value = false
    }
  }

  /**
   * Retrieves a tenant service from the store by its ID.
   *
   * @param tenantServiceId - The ID of the tenant service.
   * @returns The tenant service if found, otherwise undefined.
   */
  function getTenantService(serviceId: ServiceId): Service | undefined {
    return tenantServices.value.find((s) => s.id === serviceId)
  }

  return {
    loading,
    services,
    tenantServices,

    addServiceToTenant,
    fetchServices,
    fetchTenantServices,
    getTenantService,
  }
})
