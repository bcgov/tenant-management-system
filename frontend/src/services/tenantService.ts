import axios, { AxiosError } from 'axios'

import { logError } from '@/plugins/console'
import notificationService from '@/services/notification'
import type { Role } from '@/types/Role'
import type { Tenant } from '@/models/Tenant'
import type { User } from '@/types/User'

const tenantService = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API_URL || process.env.VITE_BACKEND_API_URL,
})

const handleError = (message: string, error: unknown) => {
  if (error instanceof AxiosError && error.response) {
    logError(message, error.response.data)
  } else {
    logError(message, error)
  }

  notificationService.addNotification(message, 'error')
}

export const createTenant = async (tenant: Tenant): Promise<Tenant> => {
  try {
    const response = await tenantService.post(`/tenants`, tenant)
    return response.data.data.tenant as Tenant
  } catch (error) {
    handleError('Error creating Tenant', error)
    throw error
  }
}

export const getUserTenants = async (userId: string): Promise<Tenant[]> => {
  try {
    const response = await tenantService.get(`/users/${userId}/tenants`)
    return response.data.data.tenants as Tenant[]
  } catch (error) {
    handleError('Error getting users tenants', error)
    throw error
  }
}

export const getUsers = async (tenantId: string): Promise<User[]> => {
  try {
    const response = await tenantService.get(`/tenants/${tenantId}/users`)
    return response.data.data.users as User[]
  } catch (error) {
    handleError('Error getting Tenant users', error)
    throw error
  }
}

export const getTenantRoles = async (tenantId: string): Promise<Role[]> => {
  try {
    const response = await tenantService.get(`/tenants/${tenantId}/roles`)
    return response.data.data.roles as Role[]
  } catch (error) {
    handleError('Error getting Tenant roles', error)
    throw error
  }
}

export const getUserRoles = async (tenantId: string, userId: string): Promise<Role[]> => {
  try {
    const response = await tenantService.get(`/tenants/${tenantId}/users/${userId}/roles`)
    return response.data.data.roles as Role[]
  } catch (error) {
    handleError('Error getting Tenant users roles', error)
    throw error
  }
}

export const addUsers = async (
  tenantId: string,
  user: User,
  roleId?: string
): Promise<User> => {
  try {
    const request: any = { user }
    if (roleId) {
      request.role = { id: roleId }
    }
    const response = await tenantService.post(`/tenants/${tenantId}/users`, request)
    return response.data.data as User
  } catch (error) {
    handleError('Error adding user to Tenant', error)
    throw error
  }
}

export const assignUserRoles = async (
  tenantId: string,
  userId: string,
  roleId: string
): Promise<void> => {
  try {
    await tenantService.put(`/tenants/${tenantId}/users/${userId}/roles/${roleId}`)
  } catch (error) {
    handleError('Error assigning user role in Tenant', error)
    throw error
  }
}
