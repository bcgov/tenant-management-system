import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  Service,
  type ServiceDetailFields,
  type ServiceId,
} from '@/models/service.model'
import { type TenantId } from '@/models/tenant.model'
import { serviceService } from '@/services/service.service'
import { serviceMapper } from '@/mappers/service.mapper'

/**
 * Pinia store for managing services.
 */
export const useServiceStore = defineStore('service', () => {
  const services = ref<Service[]>([])
  const tenantServices = ref<Service[]>([])

  // Private methods

  /**
   * Retrieves a service from the store by its ID.
   *
   * @param serviceId - The ID of the service.
   * @returns The service if found, otherwise undefined.
   */
  const getService = (serviceId: ServiceId): Service | undefined => {
    return services.value.find((s) => s.id === serviceId)
  }

  /**
   * Inserts a service in the store.
   *
   * @param service - The service to insert.
   */
  const insertService = (service: Service) => {
    services.value.push(service)
  }

  /**
   * Inserts a tenant service in the store.
   *
   * @param service - The service to insert.
   */
  const insertTenantService = (service: Service) => {
    tenantServices.value.push(service)
  }

  // Exported Methods

  /**
   * Adds a service to a tenant.
   *
   * @param tenantId - The ID of the tenant.
   * @param serviceId - The ID of the service.
   * @returns A promise that resolves when the service is added to the tenant.
   * @throws An error if the service with the given ID is not in the store.
   */
  const addServiceToTenant = async (
    tenantId: TenantId,
    serviceId: ServiceId,
  ): Promise<Service> => {
    // Grab the existing service from the store, to confirm the ID and for use
    // later.
    const service = getService(serviceId)
    if (!service) {
      throw new Error(`Service with ID ${serviceId} not found`)
    }

    await serviceService.addServiceToTenant(tenantId, serviceId)
    insertTenantService(service)

    return service
  }

  /**
   * Creates a new service.
   *
   * @param serviceDetails - The details of the service to create.
   * @returns A promise that resolves when the service is created.
   */
  const createService = async (
    serviceDetails: ServiceDetailFields,
  ): Promise<void> => {
    const serviceApiData = await serviceService.createService(serviceDetails)
    insertService(serviceMapper.fromApiData(serviceApiData))
  }

  /**
   * Fetches all services from the API and updates the store.
   *
   * @returns A promise that resolves when the API call completes.
   */
  const fetchServices = async (): Promise<void> => {
    const serviceApiData = await serviceService.getServices()
    services.value = serviceApiData.map(serviceMapper.fromApiData)
  }

  /**
   * Fetches tenant services for a tenant from the API and updates the store.
   *
   * @param tenantId - The ID of the tenant.
   * @returns A promise that resolves when the API call completes.
   */
  const fetchTenantServices = async (tenantId: TenantId): Promise<void> => {
    const serviceApiData = await serviceService.getTenantServices(tenantId)
    tenantServices.value = serviceApiData.map(serviceMapper.fromApiData)
  }

  /**
   * Retrieves a tenant service from the store by its ID.
   *
   * @param tenantServiceId - The ID of the tenant service.
   * @returns The tenant service if found, otherwise undefined.
   */
  const getTenantService = (serviceId: ServiceId): Service | undefined => {
    return tenantServices.value.find((s) => s.id === serviceId)
  }

  return {
    services,
    tenantServices,

    addServiceToTenant,
    createService,
    fetchServices,
    fetchTenantServices,
    getTenantService,
  }
})
