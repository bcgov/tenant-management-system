---
sidebar_position: 4
---

# Connected service setup

Connected services are set up in CSTAR by CSTAR operations admins.

A connected service team should work with CSTAR operations admins before trying to integrate with CSTAR APIs.

## Information needed

To set up a connected service, CSTAR operations admins need:

- service name
- display name
- client identifier
- landing page URL
- description
- roles
- role descriptions
- supported identity providers for role assignment

## Client identifier

The client identifier is used to recognize the connected service when it calls CSTAR.

It is important to get the client identifier correct. CSTAR uses it when authorizing connected-service API calls and checking whether the service is allowed to access tenant-scoped information.

## Roles

Connected services define their own roles.

CSTAR stores those roles and lets tenant administrators assign them to groups.

## Identity providers for roles

A role can be limited to specific identity providers.

For example, a role may be assignable only to IDIR users, only to BCeID Business users, or to more than one supported identity provider.

## After setup

After the connected service is set up, tenants can be associated with it.

Once a tenant is associated, tenant administrators can assign the connected-service roles to groups.
