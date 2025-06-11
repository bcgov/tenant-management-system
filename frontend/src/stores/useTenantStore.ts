import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Role } from '@/models/role.model'
import { Tenant } from '@/models/tenant.model'
import { User } from '@/models/user.model'
import { tenantService } from '@/services/tenant.service'

export const useTenantStore = defineStore('tenant', () => {
  const tenants = ref<Tenant[]>([])
  const tenantUsers = ref<Record<string, User[]>>({})
  const tenantUserRoles = ref<Record<string, Record<string, Role[]>>>({})

  const loading = ref(false)

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

  const addTenantUser = async (tenantId: string, user: User, role: string) => {
    // First add the user to tenant
    await tenantService.addUsers(tenantId, user, role)

    // Refresh tenant users after adding
    await fetchTenantUsers(tenantId)
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

  const fetchTenantUsers = async (tenantId: string) => {
    const users = await tenantService.getUsers(tenantId)
    tenantUsers.value[tenantId] = users
  }

  const fetchTenantUserRoles = async (tenantId: string, userId: string) => {
    const roles = await tenantService.getUserRoles(tenantId, userId)
    if (!tenantUserRoles.value[tenantId]) {
      tenantUserRoles.value[tenantId] = {}
    }
    tenantUserRoles.value[tenantId][userId] = roles
  }

  const addTenant = async (name: string, ministryName: string, user: User) => {
    const apiResponse = await tenantService.createTenant(
      name,
      ministryName,
      user,
    )
    const tenant = Tenant.fromApiData(apiResponse)

    return upsertTenant(tenant)
  }

  const searchAvailableUsers = async (
    tenantId: string,
    searchCriteria: {
      field: string
      value: string
    },
  ) => {
    try {
      const users = await tenantService.getUsers(tenantId)
      return users.filter((user: User) => {
        const fieldValue = user[searchCriteria.field as keyof User]

        // Handle different value types appropriately
        const stringValue =
          typeof fieldValue === 'object' && fieldValue !== null
            ? JSON.stringify(fieldValue)
            : String(fieldValue)

        return stringValue
          .toLowerCase()
          .includes(searchCriteria.value.toLowerCase())
      })
    } catch (error) {
      // logger.error('Error searching users', error)
      throw error
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
    addTenant,
    addTenantUser,
    fetchTenant,
    fetchTenants,
    fetchTenantUsers,
    fetchTenantUserRoles,
    loading,
    searchAvailableUsers,
    tenants,
    updateTenant,
  }
})
