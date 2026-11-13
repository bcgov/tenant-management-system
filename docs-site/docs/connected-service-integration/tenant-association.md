# Tenant association

This page describes how a tenant starts using a connected service. It is intended for tenant owners and connected service teams.

## What association does

A connected service is set up once in CSTAR, but it is not available to any tenant until a tenant owner associates it with their tenant. Association is the tenant's decision to use the service.

| Before association | After association |
| --- | --- |
| The service's roles cannot be assigned to groups in the tenant. | Tenant owners and user admins can assign the service's roles to groups. |
| The service cannot read any information about the tenant. | The service can retrieve roles and other tenant information for users in the tenant. |

## Associating a service

A tenant owner associates a connected service with the tenant in the CSTAR web app. Only active connected services can be associated. User admins cannot associate a connected service.

A tenant can be associated with any number of connected services.

## What the connected service can then see

Association lets the connected service read information about the tenant. It does not give the service access on its own. Each request the service makes is also checked against the signed-in user:

- the user must be a member of the tenant
- for any change, the user must hold the CSTAR role the change requires

## Related pages

- [Tenants](../tenant-management/tenants.md)
- [Groups](../tenant-management/groups.md)
- [Connected service setup](./connected-service-setup.md)
