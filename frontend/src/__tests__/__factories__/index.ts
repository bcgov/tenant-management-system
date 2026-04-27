import { Group } from '@/models/group.model'
import { Role } from '@/models/role.model'
import { SsoUser } from '@/models/ssouser.model'
import { Tenant } from '@/models/tenant.model'
import { TenantRequest } from '@/models/tenantrequest.model'
import { User } from '@/models/user.model'
import { ROLES } from '@/utils/constants'

// Group Factories

export function makeGroup(
  overrides: Partial<{
    createdBy: string
    createdDate: string
    description: string
    id: string
    name: string
  }> = {},
): Group {
  return new Group(
    overrides.createdBy ?? crypto.randomUUID(),
    overrides.createdDate ?? '2026-01-01',
    overrides.description ?? 'Test group description',
    overrides.id ?? crypto.randomUUID(),
    overrides.name ?? 'Test Group',
    [],
  )
}

// Role Factories

export function makeRole(name: string): Role {
  return new Role('role-id', name, name)
}

export function makeRoleOperationsAdmin(): Role {
  return makeRole(ROLES.OPERATIONS_ADMIN.value)
}

export function makeRoleServiceUser(): Role {
  return makeRole(ROLES.SERVICE_USER.value)
}

export function makeRoleTenantOwner(): Role {
  return makeRole(ROLES.TENANT_OWNER.value)
}

export function makeRoleUserAdmin(): Role {
  return makeRole(ROLES.USER_ADMIN.value)
}

// Tenant Factories

export function makeTenant(
  overrides: Partial<{
    id: string
    ministry: string
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
    overrides.ministry ?? "Citizens' Services",
    overrides.users ?? [],
  )
}

// Tenant Request Factories

export function makeTenantRequest(
  overrides: Partial<{
    id: string
    ministry: string
    name: string
  }> = {},
): TenantRequest {
  return new TenantRequest(
    crypto.randomUUID(),
    '2026-01-01',
    'Test tenant description',
    overrides.id ?? crypto.randomUUID(),
    overrides.name ?? 'Test Tenant Request',
    overrides.ministry ?? "Citizens' Services",
    'NEW',
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
    email: string
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
      email: overrides.email ?? 'tolstoy.twain@gov.bc.ca',
      idpType: overrides.idpType ?? 'idir',
      ssoUserId: overrides.ssoUserId ?? crypto.randomUUID(),
    }),
    overrides.roles ?? [],
  )
}

export function makeUserBceid(): User {
  return makeUser({ idpType: 'BCeID' })
}

export function makeUserIdir(): User {
  return makeUser({ idpType: 'IDIR' })
}

export function makeUserOperationsAdmin(): User {
  return makeUser({ roles: [makeRoleOperationsAdmin()] })
}
