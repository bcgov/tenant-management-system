---
sidebar_position: 2
---

# Authorization

Authentication confirms who is calling CSTAR. Authorization decides what that caller is allowed to do.

CSTAR authorization depends on the API being called. Some APIs are for CSTAR administration. Some APIs are available to connected services. Tenant-scoped APIs also check access to the tenant.

## Tenant access

Tenant-scoped actions require access to the tenant.

A user must belong to the tenant before CSTAR treats them as having tenant access. For administration actions, the user may also need a CSTAR role such as tenant owner or user admin.

## CSTAR roles

CSTAR roles control what a user can do inside CSTAR.

Tenant owner and user admin are tenant-level administration roles. They are used for actions such as managing tenant users, groups, and role assignments.

Service user is not an administration role. It is used for tenant users that participate in connected-service access flows.

## Operations admin

Operations admin access is used for CSTAR-level administration.

Operations admins can perform actions such as reviewing tenant requests and managing connected-service setup. This access is not scoped to a single tenant.

## Connected-service access

Connected services can call CSTAR APIs that are intended for connected-service use.

For tenant-scoped information, CSTAR checks that the connected service is associated with the tenant. A valid connected-service token does not automatically grant access to every tenant.

## Effective roles

Effective roles come from group membership and connected-service role assignments.

When a connected service asks CSTAR for a user's effective roles, CSTAR checks the tenant, the user, the user's groups, and the roles assigned to those groups for that connected service.
