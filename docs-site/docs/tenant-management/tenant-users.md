# Tenant users

This page describes how people are added to and removed from a tenant. It is intended for tenant owners and user admins.

## Who can be added

A **tenant user** is a person who has been added to a tenant. The person must have an IDIR or BCeID Business account. Basic BCeID is not supported.

Signing in to a connected service does not add a person to a tenant. A tenant owner or user admin must add them.

| Identity provider | CSTAR roles available | Can sign in to the CSTAR web app |
| --- | --- | --- |
| IDIR | Tenant owner, user admin, service user | Yes |
| BCeID Business | Service user only | No |

## Adding a user

A tenant owner or user admin finds the person in the BC Gov SSO directory and adds them to the tenant. IDIR users can be found by first name, last name or email. BCeID Business users can be found by display name or username.

- An IDIR user must be given at least one CSTAR role when they are added.
- A BCeID Business user always receives the service user role.
- The user can also be placed in one or more groups at the same time.

Adding a person who is not yet a tenant user to a group also adds them to the tenant, with the service user role.

The person receives an email confirming that they have been added, listing their CSTAR roles and any groups. See [Email notifications](./email-notifications.md).

## Changing a user's CSTAR roles

A tenant owner or user admin can assign and remove CSTAR roles at any time. CSTAR refuses to remove the tenant owner role from the last tenant owner.

CSTAR roles do not affect access to connected services. To change what a user can do in a connected service, change their group membership. See [Groups](./groups.md).

## Removing a user

A tenant owner or user admin can remove a user from the tenant. Removing a user:

- removes them from every group in the tenant
- removes all of their access to the tenant's connected services
- sends them an email confirming the removal

CSTAR refuses to remove the last tenant owner.

A removed user can be added to the tenant again later.

## Related pages

- [Groups](./groups.md)
- [CSTAR roles](../overview/cstar-roles.md)
- [Identity providers](../security/identity-providers.md)
