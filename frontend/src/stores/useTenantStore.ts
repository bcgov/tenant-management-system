import { defineStore } from 'pinia'
import { ref } from 'vue'

import { tenantService } from '@/services/tenant.service'
import { Role } from '@/models/role.model'
import { Tenant } from '@/models/tenant.model'
import { User } from '@/models/user.model'

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
      const tenantInstances = await Promise.all(
        tenantList.map(async (tenantData: any) => {
          const tenant = Tenant.fromApiData(tenantData)

          const userListData = await tenantService.getUsers(tenantData.id)
          const users = await Promise.all(
            userListData.map(async (userData: any) => {
              const rolesData = await tenantService.getUserRoles(
                tenant.id,
                userData.id,
              )
              userData.roles = rolesData
              return User.fromApiData(userData)
            }),
          )

          tenant.users = users

          return tenant
        }),
      )

      tenants.value = tenantInstances
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
    fetchTenant,
    fetchTenants,
    fetchTenantUsers,
    fetchTenantUserRoles,
    loading,
    tenants,
    updateTenant,
  }
})
