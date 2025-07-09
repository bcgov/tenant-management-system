import { Tenant } from '@/models'
import { useAuthStore } from '@/stores'

export function currentUserHasRole(tenant: Tenant, roleName: string): boolean {
  const currentUser = useAuthStore().authenticatedUser
  if (!currentUser) {
    return false
  }

  return tenant.userHasRole(currentUser, roleName)
}
