# Tenant users

This page describes how people are added to and removed from a tenant. It is intended for tenant owners and user admins.

## Eligibility

**A tenant user must have an IDIR or BCeID Business account.**

Basic BCeID is not supported. The identity provider determines which CSTAR roles a user can hold.

| Identity provider | CSTAR roles available | Can sign in to the CSTAR web app |
| --- | --- | --- |
| IDIR | Tenant owner, user admin, service user | Yes |
| BCeID Business | Service user only | No |

**Signing in does not make a person a tenant user.**

A person who signs in to CSTAR or to a connected service has no access to a tenant until a tenant owner or user admin adds them.

## Adding a user

**Tenant owners and user admins add users to the tenant.**

The person is found in the BC Gov SSO directory. IDIR users can be found by first name, last name or email. BCeID Business users can be found by display name or username.

- An IDIR user must be given at least one CSTAR role when they are added.
- A BCeID Business user always receives the service user role.
- The user can be added to one or more groups in the same step.

**Adding a person to a group also adds them to the tenant.**

If the person is not yet a tenant user, they are added to the tenant with the service user role.

The person receives an email listing the tenant, their CSTAR roles and any groups. See [Email notifications](./email-notifications.md).

## Changing CSTAR roles

**Tenant owners and user admins can assign and remove CSTAR roles at any time.**

CSTAR refuses to remove the tenant owner role from the last tenant owner.

**CSTAR roles do not affect access to connected services.**

Access to a connected service is changed through group membership. See [Groups](./groups.md).

## Removing a user

**Tenant owners and user admins can remove a user from the tenant.**

Removing a user:

- removes them from every group in the tenant
- removes all of their access to the tenant's connected services
- sends them an email confirming the removal

CSTAR refuses to remove the last tenant owner. A removed user can be added to the tenant again later.

## Related pages

- [Groups](./groups.md)
- [CSTAR roles](../overview/cstar-roles.md)
- [Identity providers](../security/identity-providers.md)
