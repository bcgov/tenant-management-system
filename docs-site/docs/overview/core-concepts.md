# Core concepts

This page defines the terms used throughout the CSTAR documentation. Each term is used with the same meaning on every page.

## Tenant

A **tenant** is a team, program or business area whose access is managed together. It is the boundary for everything else in CSTAR. Users, groups and role assignments in one tenant have no effect in another.

A tenant is created when an operations admin approves a tenant request. See [Tenant requests](../tenant-management/tenant-approval-workflow.md).

## Tenant user

A **tenant user** is a person who has been added to a tenant. A person signs in with a BC Government identity provider, but signing in alone does not give them access to any tenant. A tenant owner or user admin must add them first.

One person can be a tenant user in several tenants.

## CSTAR role

A **CSTAR role** controls what a tenant user can do in CSTAR itself. The CSTAR roles are tenant owner, user admin and service user. Operations admin is a separate role that applies to CSTAR as a whole rather than to one tenant.

A CSTAR role has no meaning inside a connected service. See [CSTAR roles](./cstar-roles.md).

## Group

A **group** is a named set of tenant users within one tenant. Groups exist so that access can be managed for many users at once. A user receives every connected-service role that is assigned to any group they belong to.

## Connected service

A **connected service** is an application that relies on CSTAR for its tenant and role information. An operations admin sets up each connected service in CSTAR, together with the roles it uses.

CSTAR supplies the roles a user holds. The connected service decides what each role allows the user to do.

## Connected-service role

A **connected-service role** is a role defined by a connected service, such as `viewer` or `form-designer`. Each connected service has its own set of roles. Connected-service roles are assigned to groups, never directly to a user.

A connected-service role can be limited to certain identity providers. For example, a role may be available to IDIR users only.

## Tenant association

A tenant is **associated with** a connected service when a tenant owner adds that service to the tenant. Until then, the service's roles cannot be assigned to groups in the tenant, and the service cannot read the tenant's information. See [Tenant association](../connected-service-integration/tenant-association.md).

## Effective roles

A user's **effective roles** are the connected-service roles they hold in one tenant for one connected service. CSTAR works them out from the groups the user belongs to and the roles assigned to those groups. A role granted by more than one group is counted once.

Effective roles are what a connected service retrieves when a user signs in.

## Related pages

- [How CSTAR works](./how-cstar-works.md)
- [CSTAR roles](./cstar-roles.md)
