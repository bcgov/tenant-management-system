import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Role, Tenant, User } from '@/models'
import { tenantService } from '@/services'

export const useTenantStore = defineStore('tenant', () => {
  const loading = ref(false)
  const tenants = ref<Tenant[]>([])

  // Private methods

  function upsertTenant(tenant: Tenant) {
    const index = tenants.value.findIndex((t) => t.id === tenant.id)
    if (index !== -1) {
      tenants.value[index] = tenant
    } else {
      tenants.value.push(tenant)
    }

    return tenant
  }

  // Exported Methods

  const addTenant = async (name: string, ministryName: string, user: User) => {
    const apiResponse = await tenantService.createTenant(
      name,
      ministryName,
      user,
    )
    const tenant = Tenant.fromApiData(apiResponse)

    return upsertTenant(tenant)
  }

  const addTenantUser = async (tenant: Tenant, user: User) => {
    const apiResponse = await tenantService.addUser(tenant.id, user)

    // Update tenant users after adding
    const addedUser = User.fromApiData(apiResponse)
    tenant.users.push(addedUser)
  }

  const fetchTenant = async (tenantId: string) => {
    loading.value = true
    try {
      const tenantData = await tenantService.getTenant(tenantId)
      const tenant = Tenant.fromApiData(tenantData)

      return upsertTenant(tenant)
    } finally {
      loading.value = false
    }
  }

  const fetchTenants = async (userId: string) => {
    loading.value = true
    try {
      const tenantList = await tenantService.getUserTenants(userId)
      tenants.value = tenantList.map(Tenant.fromApiData)
    } finally {
      loading.value = false
    }
  }

  const updateTenant = async (tenant: Partial<Tenant>) => {
    if (!tenant.id || !tenant.name || !tenant.ministryName) {
      // TODO: kludgy; clean this argument up.
      throw new Error('Missing required tenant fields for update')
    }

    const apiResponse = await tenantService.updateTenant(
      tenant.id,
      tenant.name,
      tenant.ministryName,
      tenant.description ?? '',
    )

    const updatedTenant = Tenant.fromApiData(apiResponse)

    return upsertTenant(updatedTenant)
  }

  return {
    loading,
    tenants,

    addTenant,
    addTenantUser,
    fetchTenant,
    fetchTenants,
    updateTenant,
  }
})
