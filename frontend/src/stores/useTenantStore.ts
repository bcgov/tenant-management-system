import { defineStore } from 'pinia'
import { ref } from 'vue'

import { Tenant, type TenantDetailFields, User } from '@/models'
import { tenantService } from '@/services'

/**
 * Pinia store for managing tenants and tenant users.
 */
export const useTenantStore = defineStore('tenant', () => {
  const loading = ref(false)
  const tenants = ref<Tenant[]>([])

  // Private methods

  /**
   * Inserts or updates a tenant in the store.
   *
   * @param {Tenant} tenant - The tenant to insert or update.
   * @returns {Tenant} The inserted or updated tenant.
   */
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

  /**
   * Creates a new tenant and adds it to the store.
   *
   * @param {string} name - The name of the tenant.
   * @param {string} ministryName - The ministry name of the tenant.
   * @param {User} user - The user creating the tenant.
   * @returns {Promise<Tenant>} The created tenant.
   */
  const addTenant = async (name: string, ministryName: string, user: User) => {
    const apiResponse = await tenantService.createTenant(
      name,
      ministryName,
      user,
    )
    const tenant = Tenant.fromApiData(apiResponse)

    return upsertTenant(tenant)
  }

  /**
   * Adds a user to a tenant.
   *
   * @param {Tenant} tenant - The tenant to add the user to.
   * @param {User} user - The user to add to the tenant.
   * @returns {Promise<void>}
   */
  const addTenantUser = async (tenant: Tenant, user: User) => {
    const apiResponse = await tenantService.addUser(tenant.id, user)

    // Update tenant users after adding
    const addedUser = User.fromApiData(apiResponse)
    tenant.users.push(addedUser)
  }

  /**
   * Fetches a tenant by ID from the API and updates the store.
   *
   * @param {string} tenantId - The ID of the tenant.
   * @returns {Promise<Tenant>} The fetched tenant.
   */
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

  /**
   * Fetches all tenants for a given user from the API and updates the store.
   *
   * @param {string} userId - The ID of the user.
   * @returns {Promise<void>}
   */
  const fetchTenants = async (userId: string) => {
    loading.value = true
    try {
      const tenantList = await tenantService.getUserTenants(userId)
      tenants.value = tenantList.map(Tenant.fromApiData)
    } finally {
      loading.value = false
    }
  }

  /**
   * Retrieves a tenant by its ID from the store.
   *
   * @param {string} tenantId - The ID of the tenant.
   * @returns {Tenant|undefined} The tenant if found, otherwise undefined.
   */
  function getTenant(tenantId: string): Tenant | undefined {
    return tenants.value.find((t) => t.id === tenantId)
  }

  /**
   * Removes a role from a user in a tenant.
   *
   * @param {Tenant} tenant - The tenant the user belongs to.
   * @param {string} userId - The ID of the user.
   * @param {string} roleId - The ID of the role to remove.
   * @throws {Error} If the user is not found in the tenant.
   * @returns {Promise<void>}
   */
  const removeTenantUserRole = async (
    tenant: Tenant,
    userId: string,
    roleId: string,
  ) => {
    await tenantService.removeUserRole(tenant.id, userId, roleId)

    const user = tenant.users.find((u) => u.id === userId)
    if (!user) {
      throw new Error(`User with ID ${userId} not found in tenant ${tenant.id}`)
    }

    user.roles = user.roles.filter((role) => role.id !== roleId)
  }

  /**
   * Updates the details of a tenant.
   *
   * @param {string} id - The ID of the tenant to update.
   * @param {TenantDetailFields} tenantDetails - The updated tenant details.
   * @throws {Error} If the tenant is not found in the store.
   * @returns {Promise<void>}
   */
  const updateTenantDetails = async (
    id: string,
    tenantDetails: TenantDetailFields,
  ) => {
    // Grab the existing tenant from the store, to confirm the ID and for use
    // later.
    const tenant = getTenant(id)
    if (!tenant) {
      throw new Error(`Tenant with ID ${id} not found`)
    }

    const apiResponse = await tenantService.updateTenant(
      id,
      tenantDetails.name,
      tenantDetails.ministryName,
      tenantDetails.description,
    )

    const updatedTenant = Tenant.fromApiData(apiResponse)

    tenant.name = updatedTenant.name
    tenant.ministryName = updatedTenant.ministryName
    tenant.description = updatedTenant.description
  }

  return {
    loading,
    tenants,

    addTenant,
    addTenantUser,
    fetchTenant,
    fetchTenants,
    getTenant,
    removeTenantUserRole,
    updateTenantDetails,
  }
})
