---
sidebar_position: 4
---

# CSTAR roles

CSTAR roles control what a user can do in CSTAR.

They are different from connected-service roles. A CSTAR role may let a user manage tenant access in CSTAR. A connected-service role tells a connected service what access the user should have in that service.

## Tenant owner

Tenant owners manage access for a tenant.

A tenant owner can manage tenant users, tenant roles, groups, and connected-service role assignments for the tenant.

## User admin

User admins help manage users and groups for a tenant.

This role is intended for users who need to help with day-to-day access administration but do not need full tenant ownership.

## Service user

Service users are tenant users that participate in connected-service access flows. Service users have read-only access to CSTAR and cannot modify anything in a tenant in CSTAR.

In CSTAR, this role is separate from tenant owner and user admin. It does not make the user an administrator in CSTAR.

## Operations admin

Operations admins manage CSTAR-level setup.

This includes tenant approvals and connected-service set up and / configuration. Operations admin access is not tenant-specific.
