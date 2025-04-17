import axios, { AxiosError } from 'axios'

import { logError } from '@/plugins/console'
import type { Role } from '@/types/Role'
import type { Tenant } from '@/models/tenant.model'
import type { User } from '@/types/User'

const tenantApi = axios.create({
  baseURL:
    import.meta.env.VITE_BACKEND_API_URL ?? process.env.VITE_BACKEND_API_URL,
})

const logApiError = (message: string, error: unknown) => {
  if (error instanceof AxiosError && error.response) {
    logError(message, error.response.data)
  } else {
    logError(message, error)
  }
}

export const createTenant = async (tenant: Tenant): Promise<Tenant> => {
  try {
    const response = await tenantApi.post(`/tenants`, tenant)
    return response.data.data.tenant as Tenant
  } catch (error) {
    logApiError('Error creating Tenant', error)
    throw error
  }
}

export const getUserTenants = async (userId: string): Promise<Tenant[]> => {
  try {
    const response = await tenantApi.get(`/users/${userId}/tenants`)
    return response.data.data.tenants as Tenant[]
  } catch (error) {
    logApiError('Error getting users tenants', error)
    throw error
  }
}

export const getUsers = async (tenantId: string): Promise<User[]> => {
  try {
    const response = await tenantApi.get(`/tenants/${tenantId}/users`)
    return response.data.data.users as User[]
  } catch (error) {
    logApiError('Error getting Tenant users', error)
    throw error
  }
}

export const getTenantRoles = async (tenantId: string): Promise<Role[]> => {
  try {
    const response = await tenantApi.get(`/tenants/${tenantId}/roles`)
    return response.data.data.roles as Role[]
  } catch (error) {
    logApiError('Error getting Tenant roles', error)
    throw error
  }
}

export const getUserRoles = async (
  tenantId: string,
  userId: string,
): Promise<Role[]> => {
  try {
    const response = await tenantApi.get(
      `/tenants/${tenantId}/users/${userId}/roles`,
    )
    return response.data.data.roles as Role[]
  } catch (error) {
    logApiError('Error getting Tenant users roles', error)
    throw error
  }
}

export const addUsers = async (
  tenantId: string,
  user: User,
  roleId?: string,
): Promise<User> => {
  try {
    const request: any = { user }
    if (roleId) {
      request.role = { id: roleId }
    }
    const response = await tenantApi.post(`/tenants/${tenantId}/users`, request)
    return response.data.data as User
  } catch (error) {
    logApiError('Error adding user to Tenant', error)
    throw error
  }
}

export const assignUserRoles = async (
  tenantId: string,
  userId: string,
  roleId: string,
): Promise<void> => {
  try {
    await tenantApi.put(`/tenants/${tenantId}/users/${userId}/roles/${roleId}`)
  } catch (error) {
    logApiError('Error assigning user role in Tenant', error)
    throw error
  }
}
