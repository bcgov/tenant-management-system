import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  createTenant,
  getUserTenants,
  getUsers,
  getUserRoles,
} from '@/services/tenantService'
import type { Role } from '@/types/Role'
import { Tenant } from '@/models/Tenant'
import type { User } from '@/types/User'

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
        tenantList.map(async (tenant) => {
          const userList = await getUsers(tenant.id)

          await Promise.all(
            userList.map(async (user) => {
              user.roles = await getUserRoles(tenant.id, user.id)
            }),
          )

          return new Tenant(
            tenant.id,
            tenant.name,
            tenant.ministryName,
            userList,
          )
        }),
      )

      tenants.value = tenantInstances
    } catch (error) {
      // error already handled in the service
    } finally {
      loading.value = false
    }
  }

  const fetchTenantUsers = async (tenantId: string) => {
    try {
      const users = await getUsers(tenantId)
      tenantUsers.value[tenantId] = users
    } catch (error) {
      // already handled
    }
  }

  const fetchTenantUserRoles = async (tenantId: string, userId: string) => {
    try {
      const roles = await getUserRoles(tenantId, userId)
      if (!tenantUserRoles.value[tenantId]) {
        tenantUserRoles.value[tenantId] = {}
      }
      tenantUserRoles.value[tenantId][userId] = roles
    } catch (error) {
      // already handled
    }
  }

  const addTenant = async (tenant: Tenant) => {
    try {
      const newTenant = await createTenant(tenant)
      tenants.value.push(newTenant)
    } catch (error) {
      // already handled
    }
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
