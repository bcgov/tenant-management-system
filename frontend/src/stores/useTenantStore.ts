import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Tenant, type TenantDetailFields, User } from '@/models'
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

  function getTenant(tenantId: string): Tenant | undefined {
    return tenants.value.find((t) => t.id === tenantId)
  }

  const removeTenantUserRole = async (
    tenant: Tenant,
    userId: string,
    roleId: string,
  ) => {
    await tenantService.removeUserRole(tenant.id, userId, roleId)

    const user = tenant.users.find((u) => u.id === userId)
    if (!user) {
      throw new Error(`User with ID ${userId} not found in tenant ${tenant.id}`)
    }

    user.roles = user.roles.filter((role) => role.id !== roleId)
  }

  const requestTenant = async (
    tenantDetails: TenantDetailFields,
    user: User,
  ) => {
    await tenantService.requestTenant(tenantDetails, user)
  }

  const updateTenantDetails = async (
    id: string,
    tenantDetails: TenantDetailFields,
  ) => {
    // Grab the existing tenant from the store, to confirm the ID and for use
    // later.
    const tenant = getTenant(id)
    if (!tenant) {
      throw new Error(`Tenant with ID ${id} not found`)
    }

    const apiResponse = await tenantService.updateTenant(
      id,
      tenantDetails.name,
      tenantDetails.ministryName,
      tenantDetails.description,
    )

    const updatedTenant = Tenant.fromApiData(apiResponse)

    tenant.name = updatedTenant.name
    tenant.ministryName = updatedTenant.ministryName
    tenant.description = updatedTenant.description
  }

  return {
    loading,
    tenants,

    addTenant,
    addTenantUser,
    fetchTenant,
    fetchTenants,
    getTenant,
    removeTenantUserRole,
    requestTenant,
    updateTenantDetails,
  }
})
