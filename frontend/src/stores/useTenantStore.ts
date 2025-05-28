import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  createTenant,
  getUserTenants,
  getUsers,
  getUserRoles,
} from '@/services/tenant.service'
import { Role } from '@/models/role.model'
import { Tenant } from '@/models/tenant.model'
import { User } from '@/models/user.model'

export const useTenantStore = defineStore('tenant', () => {
  const tenants = ref<Tenant[]>([])
  const tenantUsers = ref<Record<string, User[]>>({})
  const tenantUserRoles = ref<Record<string, Record<string, Role[]>>>({})

  const loading = ref(false)

  const fetchTenants = async (userId: string) => {
    loading.value = true
    try {
      const tenantList = await getUserTenants(userId)
      const tenantInstances = await Promise.all(
        tenantList.map(async (tenantData: any) => {
          const tenant = Tenant.fromApiData(tenantData)

          const userListData = await getUsers(tenantData.id)
          const users = await Promise.all(
            userListData.map(async (userData: any) => {
              const rolesData = await getUserRoles(tenant.id, userData.id)
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
    const users = await getUsers(tenantId)
    tenantUsers.value[tenantId] = users
  }

  const fetchTenantUserRoles = async (tenantId: string, userId: string) => {
    const roles = await getUserRoles(tenantId, userId)
    if (!tenantUserRoles.value[tenantId]) {
      tenantUserRoles.value[tenantId] = {}
    }
    tenantUserRoles.value[tenantId][userId] = roles
  }

  const addTenant = async (name: string, ministryName: string, user: User) => {
    const apiResponse = await createTenant(name, ministryName, user)
    tenants.value.push(Tenant.fromApiData(apiResponse))
  }

  return {
    addTenant,
    fetchTenants,
    fetchTenantUsers,
    fetchTenantUserRoles,
    loading,
    tenants,
  }
})
