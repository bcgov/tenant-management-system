import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Service } from '@/models'
import { serviceService } from '@/services'

export const useServiceStore = defineStore('service', () => {
  const loading = ref(false)
  const services = ref<Service[]>([])

  // Private methods

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

  const addServiceToTenant = async (tenantId: string, serviceId: string) => {
    const apiResponse = await serviceService.addServiceToTenant(
      tenantId,
      serviceId,
    )

    return apiResponse
  }

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
