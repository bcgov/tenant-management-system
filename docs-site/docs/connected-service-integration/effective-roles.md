---
sidebar_position: 3
---

# Effective roles

Effective roles are the connected-service roles a user has for a tenant.

CSTAR builds effective roles from the user's tenant membership, group membership, and the connected-service roles assigned to those groups.

## How effective roles are built

CSTAR checks:

- the tenant
- the tenant user
- the user's groups
- the connected service
- the connected-service roles assigned to those groups

The result is the set of connected-service roles the user has for that tenant.

## What connected services do with them

A connected service can use effective roles to decide what the user can do inside the application.

CSTAR provides the role information. The connected service decides what each role means in its own application.

## No roles returned

If CSTAR does not return any effective roles, the user does not have connected-service roles through CSTAR for that tenant and service.

The connected service should handle that case based on its own access rules.

## Multiple groups

A user can belong to more than one group.

If multiple groups assign roles for the same connected service, CSTAR can return roles from those group assignments.
