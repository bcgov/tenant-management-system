import axios from 'axios'

import { logError } from '@/plugins/console'
import type { Tenancy } from '@/models/tenancy.model'
import type { Role } from '@/types/Role'
import type { User } from '@/types/User'

const tenancyApi = axios.create({
  baseURL:
    import.meta.env.VITE_BACKEND_API_URL ?? process.env.VITE_BACKEND_API_URL,
})

const logApiError = (message: string, error: unknown) => {
  if (axios.isAxiosError(error)) {
    logError(`${message}: ${error.message}`, error)
  } else {
    logError(message, error)
  }
}

export const createTenancy = async (tenancy: Tenancy): Promise<Tenancy> => {
  try {
    const response = await tenancyApi.post(`/tenants`, tenancy)
    return response.data.data.tenant as Tenancy
  } catch (error) {
    logApiError('Error creating Tenancy', error)
    throw error
  }
}

export const getUserTenancies = async (userId: string): Promise<Tenancy[]> => {
  try {
    const response = await tenancyApi.get(`/users/${userId}/tenants`)
    return response.data.data.tenants as Tenancy[]
  } catch (error) {
    logApiError('Error getting users tenancies', error)
    throw error
  }
}

export const getUsers = async (tenancyId: string): Promise<User[]> => {
  try {
    const response = await tenancyApi.get(`/tenants/${tenancyId}/users`)
    return response.data.data.users as User[]
  } catch (error) {
    logApiError('Error getting Tenancy users', error)
    throw error
  }
}

export const getTenantRoles = async (tenancyId: string): Promise<Role[]> => {
  try {
    const response = await tenancyApi.get(`/tenants/${tenancyId}/roles`)
    return response.data.data.roles as Role[]
  } catch (error) {
    logApiError('Error getting Tenancy roles', error)
    throw error
  }
}

export const getUserRoles = async (
  tenancyId: string,
  userId: string,
): Promise<Role[]> => {
  try {
    const response = await tenancyApi.get(
      `/tenants/${tenancyId}/users/${userId}/roles`,
    )
    return response.data.data.roles as Role[]
  } catch (error) {
    logApiError('Error getting Tenancy users roles', error)
    throw error
  }
}

export const addUsers = async (
  tenancyId: string,
  user: User,
  roleId?: string,
): Promise<User> => {
  try {
    const request: { user: User; role?: { id: string } } = { user }
    if (roleId) {
      request.role = { id: roleId }
    }
    const response = await tenancyApi.post(`/tenants/${tenancyId}/users`, request)
    return response.data.data as User
  } catch (error) {
    logApiError('Error adding user to Tenancy', error)
    throw error
  }
}

export const assignUserRoles = async (
  tenancyId: string,
  userId: string,
  roleId: string,
): Promise<void> => {
  try {
    await tenancyApi.put(`/tenants/${tenancyId}/users/${userId}/roles/${roleId}`)
  } catch (error) {
    logApiError('Error assigning user role in Tenancy', error)
    throw error
  }
}
