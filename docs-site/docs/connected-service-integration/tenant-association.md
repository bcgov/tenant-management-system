# Tenant association

This page describes how a tenant starts using a connected service. It is intended for tenant owners and connected service teams.

## Definition

**A connected service is not available to a tenant until a tenant owner associates it with the tenant.**

A connected service is set up once in CSTAR. Association records each tenant's decision to use it.

| Before association | After association |
| --- | --- |
| The service's roles cannot be assigned to groups in the tenant. | Tenant owners and user admins can assign the service's roles to groups. |
| The service cannot read any information about the tenant. | The service can retrieve roles and other tenant information for users in the tenant. |

## Associating a service

**Only a tenant owner can associate a connected service with a tenant.**

Association is performed in the CSTAR web app. Only active connected services can be associated. A tenant can be associated with any number of connected services.

## Effect on the connected service

**Association does not give a connected service access on its own.**

Each request from the connected service is also checked against the signed-in user:

- the user must be a member of the tenant
- for any change, the user must hold the CSTAR role the change requires

## Related pages

- [Tenants](../tenant-management/tenants.md)
- [Groups](../tenant-management/groups.md)
- [Connected service setup](./connected-service-setup.md)
