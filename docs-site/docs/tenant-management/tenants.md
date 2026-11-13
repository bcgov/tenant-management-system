# Tenants

This page describes tenants and how they are managed. It is intended for tenant owners and for anyone deciding whether their team needs a tenant.

## What a tenant is

A **tenant** is a team, program or business area whose access to connected services is managed together. Each tenant has its own users, groups and role assignments. Nothing in one tenant affects another.

A team usually needs one tenant. Separate tenants are appropriate when two groups of people must be administered by different people, or must never see each other's users.

## Tenant details

| Field | Description |
| --- | --- |
| Name | The tenant's name, up to 255 characters. |
| Ministry name | The ministry or organization the tenant belongs to, up to 100 characters. |
| Description | Optional. Up to 500 characters. |

The combination of name and ministry name must be unique. CSTAR refuses to create or rename a tenant if another tenant already has the same name in the same ministry.

Only a tenant owner can change the tenant details.

## Creating a tenant

A tenant is created when an operations admin approves a tenant request. The person who submitted the request becomes the first tenant owner. See [Tenant requests](./tenant-approval-workflow.md).

## Tenant owners

Every tenant has at least one tenant owner. CSTAR refuses any change that would leave a tenant without one, whether by removing the role or by removing the user from the tenant.

A tenant with more than one tenant owner is recommended, so that access can still be managed when one owner is unavailable.

## Connected services

A tenant owner chooses which connected services the tenant uses by associating them with the tenant. Until a connected service is associated, its roles cannot be assigned to groups in the tenant. See [Tenant association](../connected-service-integration/tenant-association.md).

## Related pages

- [Tenant users](./tenant-users.md)
- [Groups](./groups.md)
- [CSTAR roles](../overview/cstar-roles.md)
