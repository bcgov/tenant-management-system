---
sidebar_position: 1
---

# Tenants

A tenant is the main access boundary in CSTAR.

Tenants are used to keep users, groups, and role assignments separate from other tenants. A connected service checks access in the context of a tenant.

## Tenant ownership

Each tenant should have at least one tenant owner.

Tenant owners are responsible for managing access for the tenant. This includes adding users, assigning CSTAR roles, creating groups, and assigning connected-service roles to groups.

## Tenant users

Users must be added to a tenant before they can be placed into groups or receive connected-service roles through those groups.

## Tenant groups

Groups are created inside a tenant.

They are used to organize users and assign connected-service roles.

## Connected services for a tenant

A tenant can be associated with one or more connected services.

Once that association exists, connected-service roles can be assigned to groups in that tenant.
