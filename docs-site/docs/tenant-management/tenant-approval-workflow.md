---
title: Tenant requests
---

# Tenant requests

This page describes how a new tenant is requested and approved. It is intended for people requesting a tenant and for operations admins who review requests.

## Who can request a tenant

Any IDIR user who can sign in to the CSTAR web app can request a tenant. BCeID users cannot request a tenant.

## Submitting a request

The requester provides the following details in the CSTAR web app.

| Field | Required | Limit |
| --- | --- | --- |
| Tenant name | Yes | 255 characters. Must not start or end with a space. |
| Ministry name | Yes | 100 characters |
| Description | No | 500 characters |

CSTAR refuses the request if a tenant with the same name already exists in the same ministry.

When the request is submitted, the CSTAR operations team receives an email asking them to review it. See [Email notifications](./email-notifications.md).

## Request statuses

| Status | Meaning |
| --- | --- |
| `NEW` | Submitted and awaiting a decision. |
| `APPROVED` | Approved. The tenant has been created. |
| `REJECTED` | Rejected. No tenant was created. |

A decision is final. A request that is `APPROVED` or `REJECTED` cannot be changed. A requester whose request was rejected can submit a new one.

## Reviewing a request

An operations admin reviews each `NEW` request in the CSTAR web app and either approves or rejects it.

- **Approving.** The operations admin can correct the tenant name before approving. CSTAR checks again that the name is not already in use in the same ministry.
- **Rejecting.** The operations admin must give a reason. The reason is included in the email sent to the requester.

## After approval

When a request is approved, CSTAR:

1. creates the tenant with the details from the request
2. adds the requester as a tenant user with the tenant owner, user admin and service user roles
3. emails the requester to confirm the approval

The new tenant owner can then sign in to CSTAR, associate connected services with the tenant, and add users and groups.

## Related pages

- [Tenants](./tenants.md)
- [Email notifications](./email-notifications.md)
- [CSTAR roles](../overview/cstar-roles.md)
