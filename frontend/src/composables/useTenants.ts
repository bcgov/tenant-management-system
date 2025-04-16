// composables/useTenants.ts
import axios, { AxiosError } from 'axios'
import { logError } from '@/plugins/console'
import notificationService from '@/services/notification'
import type { Tenancy } from '@/models/Tenant'
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
  const createTenant = async (tenancy: Tenancy) => {
    try {
      const response = await tenantService.post(`/tenants`, tenancy)
      return response.data.data.tenant
    } catch (error) {
      handleError(error, 'Error creating tenancy')
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

  const getTenantUsers = async (tenancyId: string) => {
    try {
      const response = await tenantService.get(`/tenants/${tenancyId}/users`)
      return response.data.data.users
    } catch (error) {
      handleError(error, 'Error getting tenancy users')
    }
  }

  const getTenantRoles = async (tenancyId: string) => {
    try {
      const response = await tenantService.get(`/tenants/${tenancyId}/roles`)
      return response.data.data.roles
    } catch (error) {
      handleError(error, 'Error getting tenancy roles')
    }
  }

  const getTenantUserRoles = async (tenancyId: string, userId: string) => {
    try {
      const response = await tenantService.get(
        `/tenants/${tenancyId}/users/${userId}/roles`,
      )
      return response.data.data.roles
    } catch (error) {
      handleError(error, 'Error getting tenancy user roles')
    }
  }

  const addTenantUsers = async (
    tenancyId: string,
    user: User,
    roleId?: string,
  ) => {
    try {
      const request: any = { user }
      if (roleId != null) {
        request.role = { id: roleId }
      }
      const response = await tenantService.post(
        `/tenants/${tenancyId}/users`,
        request,
      )
      return response.data.data
    } catch (error) {
      handleError(error, 'Error adding user to tenancy')
    }
  }

  const assignUserRoles = async (
    tenancyId: string,
    userId: string,
    roleId: string,
  ) => {
    try {
      const response = await tenantService.put(
        `/tenants/${tenancyId}/users/${userId}/roles/${roleId}`,
      )
      return response.data
    } catch (error) {
      handleError(error, 'Error assigning user role in tenancy')
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
