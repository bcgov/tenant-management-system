import { Role } from '../entities/Role'
import { SSOUser } from '../entities/SSOUser'
import { Tenant } from '../entities/Tenant'
import { TenantUser } from '../entities/TenantUser'
import { TenantUserRole } from '../entities/TenantUserRole'

export interface RoleDto {
  id: string
  name: string
  description: string
  createdDateTime: Date
  updatedDateTime: Date
  createdBy: string
  updatedBy: string
}

export interface SSOUserDto {
  id: string
  ssoUserId: string
  firstName: string
  lastName: string
  displayName: string
  userName: string
  email: string
  idpType: string
  createdDateTime: Date
  updatedDateTime: Date
  createdBy: string
  updatedBy: string
}

export interface TenantUserDto {
  id: string
  ssoUser: SSOUserDto | undefined
  isDeleted: boolean
  createdDateTime: Date
  updatedDateTime: Date
  createdBy: string
  updatedBy: string
  roles: RoleDto[]
}

export interface TenantDto {
  id: string
  name: string
  ministryName: string
  description: string
  createdDateTime: Date
  updatedDateTime: Date
  createdBy: string
  updatedBy: string
  users?: TenantUserDto[]
}

export class TMSMapper {
  public toTenantDto(tenant: Tenant): TenantDto {
    return {
      id: tenant.id,
      name: tenant.name,
      ministryName: tenant.ministryName,
      description: tenant.description,
      createdDateTime: tenant.createdDateTime,
      updatedDateTime: tenant.updatedDateTime,
      createdBy: tenant.createdBy,
      updatedBy: tenant.updatedBy,
      users: tenant.users
        ? tenant.users.map((user) => this.toTenantUserDto(user))
        : tenant.users,
    }
  }

  public toTenantDtos(tenants: Tenant[]): TenantDto[] {
    return tenants.map((tenant) => this.toTenantDto(tenant))
  }

  private toTenantUserDto(user: TenantUser): TenantUserDto {
    return {
      id: user.id,
      ssoUser: user.ssoUser ? this.toSSOUserDto(user.ssoUser) : undefined,
      isDeleted: user.isDeleted,
      createdDateTime: user.createdDateTime,
      updatedDateTime: user.updatedDateTime,
      createdBy: user.createdBy,
      updatedBy: user.updatedBy,
      roles: (user.roles || []).map((assignment) => this.toRoleDto(assignment)),
    }
  }

  private toSSOUserDto(ssoUser: SSOUser): SSOUserDto {
    return {
      id: ssoUser.id,
      ssoUserId: ssoUser.ssoUserId,
      firstName: ssoUser.firstName,
      lastName: ssoUser.lastName,
      displayName: ssoUser.displayName,
      userName: ssoUser.userName,
      email: ssoUser.email,
      idpType: ssoUser.idpType,
      createdDateTime: ssoUser.createdDateTime,
      updatedDateTime: ssoUser.updatedDateTime,
      createdBy: ssoUser.createdBy,
      updatedBy: ssoUser.updatedBy,
    }
  }

  private toRoleDto(assignment: TenantUserRole): RoleDto {
    const role: Role = assignment.role
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdDateTime: role.createdDateTime,
      updatedDateTime: role.updatedDateTime,
      createdBy: role.createdBy,
      updatedBy: role.updatedBy,
    }
  }
}
