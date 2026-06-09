---
sidebar_position: 5
---

# Connected services

A connected service is an application or service that uses CSTAR for tenant and role information.

Connected services define their own roles. CSTAR stores those roles and allows them to be assigned to tenant groups.

## What CSTAR provides

CSTAR can provide tenant membership, group membership, and effective roles for a user.

This lets a connected service ask CSTAR what access a user has for a tenant instead of maintaining the same access data itself.

## What the connected service owns

The connected service owns its application behavior.

CSTAR may tell a connected service that a user has a specific role. The connected service decides what that role allows the user to do inside the application.

## Service roles

Connected-service roles are created for a specific connected service.

For example, one connected service may define a viewer role and an admin role. Another connected service may define a different set of roles.

Those roles can be assigned to groups in a tenant.

## Tenant association

A tenant must be associated with a connected service before roles for that service can be assigned to tenant groups.

This keeps connected-service role assignment to tenants that are expected / chosen to use the service.
