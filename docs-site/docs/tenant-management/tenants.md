# Tenants

This page describes tenants and the rules that govern them. It is intended for tenant owners and for anyone deciding whether their team requires a tenant.

## Definition

**A tenant is a team, program or business area whose access to connected services is managed together.**

Each tenant has its own users, groups and role assignments. Nothing in one tenant affects another.

**A team normally requires one tenant.**

Separate tenants are appropriate only when two groups of people must be administered by different people, or must not see each other's users.

## Tenant details

| Field | Required | Limit |
| --- | --- | --- |
| Name | Yes | 255 characters |
| Ministry name | Yes | 100 characters |
| Description | No | 500 characters |

**The combination of name and ministry name must be unique.**

CSTAR refuses to create or rename a tenant if another tenant has the same name in the same ministry.

**Only a tenant owner can change the tenant details.**

## Creation

**A tenant is created when an operations admin approves a tenant request.**

The person who submitted the request becomes the first tenant owner. See [Tenant requests](./tenant-approval-workflow.md).

## Tenant owners

**Every tenant has at least one tenant owner.**

CSTAR refuses any change that would leave a tenant without a tenant owner, whether by removing the role or by removing the user from the tenant.

Each tenant should have at least two tenant owners, so that the tenant can still be managed when one owner is unavailable.

## Connected services

**A tenant owner decides which connected services the tenant uses.**

A connected service is made available to a tenant by associating it with the tenant. Until a connected service is associated, its roles cannot be assigned to groups in the tenant. See [Tenant association](../connected-service-integration/tenant-association.md).

## Related pages

- [Tenant users](./tenant-users.md)
- [Groups](./groups.md)
- [CSTAR roles](../overview/cstar-roles.md)
