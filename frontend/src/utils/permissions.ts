import { Tenant } from '@/models/tenant.model'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROLES } from '@/utils/constants'

/**
 * Checks if the current user has a specific role in the given tenant.
 *
 * @param tenant - The tenant to check against.
 * @param roleName - The role name to check for.
 * @returns True if the current user has the specified role in the tenant, false
 *   otherwise.
 */
export function currentUserHasRole(tenant: Tenant, roleName: string): boolean {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    return false
  }

  return tenant.userHasRole(authStore.authenticatedUser, roleName)
}

/**
 * Checks if the current user is an operations admin.
 *
 * This function uses the auth store to determine if the current user has
 * operations admin privileges.
 *
 * @returns True if the current user is an operations admin, false otherwise.
 */
export function currentUserIsOperationsAdmin(): boolean {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    return false
  }

  const currentUser = authStore.authenticatedUser

  return currentUser.roles.some(
    (role) => role.name === ROLES.OPERATIONS_ADMIN.value,
  )
}
