import { defineStore } from 'pinia'
import { ref } from 'vue'

import { tenantMapper } from '@/mappers/tenant.mapper'
import { userMapper } from '@/mappers/user.mapper'
import { Role, type RoleId } from '@/models/role.model'
import { type SsoUserId } from '@/models/ssouser.model'
import {
  Tenant,
  type TenantDetailFields,
  type TenantId,
} from '@/models/tenant.model'
import { User, type UserId } from '@/models/user.model'
import { tenantService } from '@/services/tenant.service'
import { useRoleStore } from '@/stores/useRoleStore'

/**
 * Pinia store for managing tenants and tenant users.
 */
export const useTenantStore = defineStore('tenant', () => {
  const tenants = ref<Tenant[]>([])

  // Private methods

  /**
   * Inserts or updates a tenant in the store.
   *
   * @param tenant - The tenant to insert or update.
   * @returns The inserted or updated tenant.
   */
  const upsertTenant = (tenant: Tenant): Tenant => {
    const index = tenants.value.findIndex((t) => t.id === tenant.id)
    if (index === -1) {
      tenants.value.push(tenant)
    } else {
      tenants.value[index] = tenant
    }

    return tenant
  }

  // Exported Methods

  /**
   * Adds a user to a tenant.
   *
   * @param tenant - The tenant to add the user to.
   * @param user - The user to add to the tenant.
   * @returns A promise that resolves when the user is added to the tenant.
   */
  const addTenantUser = async (tenantId: TenantId, user: User) => {
    const tenant = getTenant(tenantId)
    if (!tenant) {
      throw new Error(`Unknown tenantId: ${tenantId}`)
    }

    const userApiData = await tenantService.addUser(tenantId, user)

    // Add user to tenant so that it doesn't need to be fetched again.
    const addedUser = userMapper.fromApiData(userApiData)
    tenant.users.push(addedUser)
  }

  /**
   * Adds/Assigns roles from a user in a tenant. (removes those not in array)
   *
   * @param tenant - The tenant the user belongs to.
   * @param userId - The ID of the user.
   * @param roleIds - The IDs of the role to ensure are present.
   * @throws {Error} If the user is not found in the tenant.
   * @returns A promise that resolves when the roles are assigned.
   */
  const assignTenantUserRoles = async (
    tenant: Tenant,
    userId: UserId,
    roleIds: RoleId[],
    fullRoleIds?: string[],
  ): Promise<void> => {
    fullRoleIds ??= roleIds

    const roleStore = useRoleStore()
    await tenantService.assignUserRoles(tenant.id, userId, roleIds)

    const user = tenant.users.find((u) => u.id === userId)
    if (!user) {
      throw new Error(`User with ID ${userId} not found in tenant ${tenant.id}`)
    }

    const newRoles = roleStore.roles.filter((role) => {
      return fullRoleIds.includes(role.id)
    })

    user.roles = newRoles
  }

  /**
   * Fetches a tenant by ID from the API and updates the store.
   *
   * @param tenantId - The ID of the tenant.
   * @returns A promise that resolves to the fetched tenant.
   */
  const fetchTenant = async (tenantId: TenantId): Promise<Tenant> => {
    const tenantApiData = await tenantService.getTenant(tenantId)
    const tenant = tenantMapper.fromApiData(tenantApiData)

    return upsertTenant(tenant)
  }

  /**
   * Fetches all tenants for a given user from the API and updates the store.
   *
   * @param ssoUserId - The ID of the SSO user.
   * @returns A promise that resolves when the tenants are fetched and the store
   *   is updated.
   */
  const fetchTenants = async (ssoUserId: SsoUserId): Promise<void> => {
    const tenantApiData = await tenantService.getUserTenants(ssoUserId)
    tenants.value = tenantApiData.map(tenantMapper.fromApiData)
  }

  /**
   * Retrieves a tenant by its ID from the store.
   *
   * @param tenantId - The ID of the tenant.
   * @returns The tenant if found, otherwise undefined.
   */
  const getTenant = (tenantId: TenantId): Tenant | undefined => {
    return tenants.value.find((t) => t.id === tenantId)
  }

  /**
   * Removes a user from a tenant.
   *
   * @param tenantId - the ID of the tenant.
   * @param userId - the ID of the user.
   */
  const removeTenantUser = async (tenantId: TenantId, userId: UserId) => {
    await tenantService.removeUser(tenantId, userId)
    const tenant = getTenant(tenantId)
    if (tenant) {
      tenant.users = tenant.users.filter((u) => u.id !== userId)
    }
  }

  /**
   * Removes a role from a user in a tenant.
   *
   * @param tenant - The tenant the user belongs to.
   * @param userId - The ID of the user.
   * @param roleId - The ID of the role to remove.
   * @throws {Error} If the user is not found in the tenant.
   * @returns A promise that resolves when the role is removed.
   */
  const removeTenantUserRole = async (
    tenantId: TenantId,
    userId: UserId,
    roleId: RoleId,
  ): Promise<void> => {
    const tenant = getTenant(tenantId)
    if (!tenant) {
      throw new Error(`Unknown tenantId: ${tenantId}`)
    }

    const user = tenant.users.find((u) => u.id === userId)
    if (!user) {
      throw new Error(`User with ID ${userId} not found in tenant ${tenantId}`)
    }

    await tenantService.removeUserRole(tenantId, userId, roleId)

    user.roles = user.roles.filter((role: Role) => role.id !== roleId)
  }

  /**
   * Updates the details of a tenant.
   *
   * @param tenantId - The ID of the tenant to update.
   * @param tenantDetails - The updated tenant details.
   * @throws {Error} If the tenant is not found in the store.
   * @returns A promise that resolves when the tenant details are updated.
   */
  const updateTenantDetails = async (
    tenantId: TenantId,
    tenantDetails: TenantDetailFields,
  ): Promise<void> => {
    // Grab the existing tenant from the store, to confirm the ID and for use
    // later.
    const tenant = getTenant(tenantId)
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`)
    }

    const tenantApiData = await tenantService.updateTenant(
      tenantId,
      tenantDetails.name,
      tenantDetails.ministryName,
      tenantDetails.description,
    )

    const tenantData = tenantMapper.fromApiData(tenantApiData)

    tenant.name = tenantData.name
    tenant.ministryName = tenantData.ministryName
    tenant.description = tenantData.description
  }

  return {
    tenants,

    addTenantUser,
    assignTenantUserRoles,
    fetchTenant,
    fetchTenants,
    getTenant,
    removeTenantUser,
    removeTenantUserRole,
    updateTenantDetails,
  }
})
