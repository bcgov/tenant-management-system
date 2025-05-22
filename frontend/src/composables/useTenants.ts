// composables/useTenants.ts
import axios, { AxiosError } from 'axios'
import { logError } from '@/plugins/console'
import notificationService from '@/services/notification'
import type { Tenant } from '@/models/tenant.model'
import type { User } from '@/types/User'

const tenantService = axios.create({
  baseURL:
    import.meta.env.VITE_BACKEND_API_URL || process.env.VITE_BACKEND_API_URL,
})

function handleError(error: unknown, message: string) {
  if (error instanceof AxiosError && error.response) {
    logError(message, error.response.data)
  } else {
    logError(message, error)
  }
  notificationService.addNotification(message, 'error')
  throw error
}

export const useTenants = () => {
  const createTenant = async (tenant: Tenant) => {
    try {
      const response = await tenantService.post(`/tenants`, tenant)
      return response.data.data.tenant
    } catch (error) {
      handleError(error, 'Error creating tenant')
    }
  }

  const getUserTenants = async (userId: string) => {
    try {
      const response = await tenantService.get(`/users/${userId}/tenants`)
      return response.data.data.users
    } catch (error) {
      handleError(error, 'Error getting user’s tenants')
    }
  }

  const getTenantUsers = async (tenantId: string) => {
    try {
      const response = await tenantService.get(`/tenants/${tenantId}/users`)
      return response.data.data.users
    } catch (error) {
      handleError(error, 'Error getting tenant users')
    }
  }

  const getTenantRoles = async (tenantId: string) => {
    try {
      const response = await tenantService.get(`/tenants/${tenantId}/roles`)
      return response.data.data.roles
    } catch (error) {
      handleError(error, 'Error getting tenant roles')
    }
  }

  const getTenantUserRoles = async (tenantId: string, userId: string) => {
    try {
      const response = await tenantService.get(
        `/tenants/${tenantId}/users/${userId}/roles`,
      )
      return response.data.data.roles
    } catch (error) {
      handleError(error, 'Error getting tenant user roles')
    }
  }

  const addTenantUsers = async (
    tenantId: string,
    user: User,
    roleId?: string,
  ) => {
    try {
      const request: any = { user }
      if (roleId != null) {
        request.role = { id: roleId }
      }
      const response = await tenantService.post(
        `/tenants/${tenantId}/users`,
        request,
      )
      return response.data.data
    } catch (error) {
      handleError(error, 'Error adding user to tenant')
    }
  }

  const assignUserRoles = async (
    tenantId: string,
    userId: string,
    roleId: string,
  ) => {
    try {
      const response = await tenantService.put(
        `/tenants/${tenantId}/users/${userId}/roles/${roleId}`,
      )
      return response.data
    } catch (error) {
      handleError(error, 'Error assigning user role in tenant')
    }
  }

  return {
    createTenant,
    getUserTenants,
    getTenantUsers,
    getTenantRoles,
    getTenantUserRoles,
    addTenantUsers,
    assignUserRoles,
  }
}
