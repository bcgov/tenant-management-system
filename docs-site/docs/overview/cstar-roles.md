# CSTAR roles

This page describes the CSTAR roles and the actions each one permits. It is intended for tenant owners, user admins and anyone deciding which role to give a tenant user.

## Purpose of CSTAR roles

**CSTAR roles control access to CSTAR only.**

A CSTAR role does not give a user any role in a connected service. Access to a connected service comes from connected-service roles, which are assigned through groups.

## Roles

| Role | Scope | Intended for |
| --- | --- | --- |
| Tenant owner | One tenant | The people accountable for the tenant. |
| User admin | One tenant | The people who manage users and groups day to day. |
| Service user | One tenant | All other members of the tenant. Gives read-only access to the tenant in CSTAR. |
| Operations admin | All of CSTAR | The CSTAR operations team. Not a tenant role. |

**A tenant user can hold more than one CSTAR role.**

The person who requested the tenant receives the tenant owner, user admin and service user roles when the request is approved.

## Permitted actions

| Action | Tenant owner | User admin | Service user | Operations admin |
| --- | :---: | :---: | :---: | :---: |
| View the tenant, its users, groups and connected services | Yes | Yes | Yes | No |
| View a tenant user's full details | Yes | Yes | No | No |
| Add and remove tenant users | Yes | Yes | No | No |
| Assign and remove CSTAR roles | Yes | Yes | No | No |
| Create and update groups | Yes | Yes | No | No |
| Add and remove group members | Yes | Yes | No | No |
| Assign connected-service roles to groups | Yes | Yes | No | No |
| Update tenant details | Yes | No | No | No |
| Associate a connected service with the tenant | Yes | No | No | No |
| Review tenant requests | No | No | No | Yes |
| Create a tenant without a tenant request | No | No | No | Yes |
| Set up connected services and their roles | No | No | No | Yes |

**Operations admins have no access inside a tenant unless they are also a member of it.**

## Rules

**Every tenant has at least one tenant owner.**

CSTAR refuses to remove the tenant owner role from the last tenant owner, and refuses to remove the last tenant owner from the tenant.

**BCeID Business users can hold the service user role only.**

A BCeID Business user cannot be a tenant owner or user admin.

**The operations admin role is granted outside CSTAR.**

It is assigned through the CSTAR client in BC Gov SSO, and applies only when the user signs in to the CSTAR web app.

## Related pages

- [Core principles](./core-principles.md)
- [Tenant users](../tenant-management/tenant-users.md)
- [Authorization](../security/authorization.md)
