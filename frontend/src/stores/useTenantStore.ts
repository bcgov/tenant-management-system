import { defineStore } from 'pinia'
import { ref } from 'vue'

import { useNotification } from '@/composables/useNotification'
import {
  createTenant,
  getUserTenants,
  getUsers,
  getUserRoles,
} from '@/services/tenant.service'
import type { Role } from '@/types/Role'
import { Tenant } from '@/models/tenant.model'
import type { User } from '@/types/User'

export const useTenantStore = defineStore('tenant', () => {
  const tenants = ref<Tenant[]>([])
  const tenantUsers = ref<Record<string, User[]>>({})
  const tenantUserRoles = ref<Record<string, Record<string, Role[]>>>({})
  const { addNotification } = useNotification()

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
      addNotification({
        id: new Date().toString(),
        message: 'Error fetching tenants: ' + error,
        type: 'error',
      })
    } finally {
      loading.value = false
    }
  }

  const fetchTenantUsers = async (tenantId: string) => {
    try {
      const users = await getUsers(tenantId)
      tenantUsers.value[tenantId] = users
    } catch (error) {
      addNotification({
        id: new Date().toString(),
        message: 'Error fetching tenant users: ' + error,
        type: 'error',
      })
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
      addNotification({
        id: new Date().toString(),
        message: 'Error fetching tenant user roles: ' + error,
        type: 'error',
      })
    }
  }

  const addTenant = async (tenant: Tenant) => {
    try {
      const newTenant = await createTenant(tenant)
      tenants.value.push(newTenant)
    } catch (error) {
      addNotification({
        id: new Date().toString(),
        message: 'Error adding tenant: ' + error,
        type: 'error',
      })
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
