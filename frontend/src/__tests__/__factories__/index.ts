import { Role } from '@/models/role.model'
import { SsoUser } from '@/models/ssouser.model'
import { Tenant } from '@/models/tenant.model'
import { User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

// Role Factories

export function makeOperationsAdminRole(): Role {
  return makeRole(ROLES.OPERATIONS_ADMIN.value)
}

export function makeRole(name: string): Role {
  return new Role('role-id', name, name)
}

export function makeServiceUserRole(): Role {
  return makeRole(ROLES.SERVICE_USER.value)
}

export function makeTenantOwnerRole(): Role {
  return makeRole(ROLES.TENANT_OWNER.value)
}

export function makeUserAdminRole(): Role {
  return makeRole(ROLES.USER_ADMIN.value)
}

// Tenant Factories

export function makeTenant(
  overrides: Partial<{
    id: string
    name: string
    users: User[]
  }> = {},
): Tenant {
  return new Tenant(
    crypto.randomUUID(),
    '2026-01-01',
    'Test tenant description',
    overrides.id ?? crypto.randomUUID(),
    overrides.name ?? 'Test Tenant',
    "Citizens' Services",
    overrides.users ?? [],
  )
}

// User Factories

export function makeSsoUser(
  overrides: Partial<{
    displayName: string
    email: string
    firstName: string
    idpType: string
    lastName: string
    ssoUserId: string
    userName: string
  }> = {},
): SsoUser {
  return new SsoUser(
    overrides.ssoUserId ?? crypto.randomUUID(),
    overrides.userName ?? 'TOLTWAIN',
    overrides.firstName ?? 'Tolstoy',
    overrides.lastName ?? 'Twain',
    overrides.displayName ?? 'Twain, Tolstoy CITZ:EX',
    overrides.email ?? 'tolstoy.twain@gov.bc.ca',
    overrides.idpType ?? 'idir',
  )
}

export function makeUser(
  overrides: Partial<{
    displayName: string
    id: string
    idpType: string
    roles: Role[]
    ssoUserId: string
  }> = {},
): User {
  return new User(
    overrides.id ?? crypto.randomUUID(),
    makeSsoUser({
      displayName: overrides.displayName ?? 'Twain, Tolstoy CITZ:EX',
      idpType: overrides.idpType ?? 'idir',
      ssoUserId: overrides.ssoUserId ?? crypto.randomUUID(),
    }),
    overrides.roles ?? [],
  )
}

export function makeOperationsAdminUser(): User {
  return makeUser({ roles: [makeOperationsAdminRole()] })
}
