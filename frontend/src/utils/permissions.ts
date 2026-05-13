import { Tenant } from '@/models/tenant.model'
import { useAuthStore } from '@/stores/useAuthStore'
import { ROLES } from '@/utils/constants'
import { isIdpBceid, isIdpIdir } from '@/utils/identityProvider'

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
 * Checks if the current user is a BceID user.
 *
 * This function uses the auth store to determine if the current user logged in
 * with BCeID credentials.
 *
 * @returns True if the current user is a BCeID user, false otherwise.
 */
export function currentUserIsBceid(): boolean {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    return false
  }

  return isIdpBceid(authStore.authenticatedUser.ssoUser.idpType)
}

/**
 * Checks if the current user is an IDIR user.
 *
 * This function uses the auth store to determine if the current user logged in
 * with IDIR credentials.
 *
 * @returns True if the current user is an IDIR user, false otherwise.
 */
export function currentUserIsIdir(): boolean {
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    return false
  }

  return isIdpIdir(authStore.authenticatedUser.ssoUser.idpType)
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
