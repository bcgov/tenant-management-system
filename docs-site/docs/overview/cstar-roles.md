# CSTAR roles

This page describes the CSTAR roles and what each one allows. It applies to tenant owners, user admins and anyone deciding which role to give a tenant user.

CSTAR roles control access to CSTAR only. They do not give a user any role in a connected service. Access to a connected service comes from connected-service roles, which are assigned through groups.

## Roles

| Role | Scope | Intended for |
| --- | --- | --- |
| Tenant owner | One tenant | The people accountable for the tenant. Every tenant has at least one. |
| User admin | One tenant | People who manage users and groups day to day. |
| Service user | One tenant | Everyone else in the tenant. Gives read-only access to the tenant in CSTAR. |
| Operations admin | All of CSTAR | The CSTAR operations team. Not a tenant role. |

A tenant user can hold more than one role. The person who requested the tenant receives all three tenant roles when the request is approved.

## What each role allows

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

Operations admins have no access inside a tenant unless they are also a tenant user in that tenant.

## Rules

- **At least one tenant owner.** CSTAR refuses to remove the tenant owner role from the last tenant owner, and refuses to remove the last tenant owner from the tenant.
- **BCeID Business users.** A BCeID Business user can hold the service user role only. They cannot be a tenant owner or user admin.
- **Operations admin.** This role is granted through the CSTAR client in BC Gov SSO, not in CSTAR. It applies only when the user signs in to the CSTAR web app.

## Related pages

- [Core concepts](./core-concepts.md)
- [Tenant users](../tenant-management/tenant-users.md)
- [Authorization](../security/authorization.md)
