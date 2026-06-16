---
sidebar_position: 3
---

# How CSTAR works

CSTAR manages access through tenants, users, groups, and connected-service roles.

A user belongs to a tenant. Inside that tenant, the user can be added to one or more groups. Connected-service roles are assigned to those groups. When a connected service needs to know what access the user has, it can ask CSTAR for the user's effective roles.

## Basic flow

1. A tenant is created in CSTAR.
2. Users are added to the tenant.
3. Groups are created inside the tenant.
4. Users are added to groups.
5. Connected-service roles are assigned to groups.
6. A connected service checks CSTAR for the user's effective roles.

## What CSTAR decides

CSTAR stores tenant membership, group membership, CSTAR roles, connected-service roles, and the assignments between them.

CSTAR can tell a connected service which roles a user has for a tenant. It does not decide what those roles mean inside the connected service.

## What the connected service decides

The connected service owns its application-specific authorization.

For example, CSTAR may tell a service that a user has an editor role. The connected service decides what an editor is allowed to do in that application.

## Groups and role assignment

Groups are the main way connected-service roles are assigned.

Instead of assigning a connected-service role directly to each user, a tenant owner / user admin can assign the role to a group. Users in that group receive the role through their group membership.
