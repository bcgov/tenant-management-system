# Identity providers

This page describes the identity providers CSTAR supports and what each one permits. It is intended for tenant administrators and connected service teams.

## Authentication

**CSTAR does not authenticate users itself.**

Users sign in through BC Gov SSO with a supported identity provider. CSTAR uses the identity in the resulting token to determine who the user is.

**Signing in does not give a user access to a tenant.**

A user has access to a tenant only after a tenant owner or user admin adds them.

## Supported identity providers

| Identity provider | CSTAR web app | Connected services | CSTAR roles available |
| --- | --- | --- | --- |
| IDIR | Supported | Supported | Tenant owner, user admin, service user |
| BCeID Business | Not supported | Supported | Service user only |
| Basic BCeID | Not supported | Not supported | None |

## IDIR

**IDIR is the only identity provider accepted by the CSTAR web app.**

Tenant owners, user admins and operations admins must use IDIR. Tenant requests can be submitted by IDIR users only.

**Only IDIR users can manage access through a connected service.**

See [Managing access from a connected service](../connected-service-integration/managing-access.md).

## BCeID Business

**BCeID Business users can hold the service user role only.**

A BCeID Business user can be a tenant user and a member of groups, and can receive connected-service roles through those groups. They cannot sign in to the CSTAR web app, and cannot be a tenant owner or user admin.

A connected service that signs users in with both BCeID types is supported. CSTAR accepts the token when it identifies a BCeID Business user.

## Basic BCeID

**Basic BCeID is not supported.**

Basic BCeID users cannot be added to a tenant, and requests on their behalf are refused.

## Identity provider limits on roles

**A connected-service role can be limited to certain identity providers.**

A role limited to IDIR users is not returned for a BCeID Business user, even if the user belongs to a group that holds the role. See [Connected service setup](../connected-service-integration/connected-service-setup.md).

## Related pages

- [Tenant users](../tenant-management/tenant-users.md)
- [Authentication](../connected-service-integration/authentication.md)
- [Authorization](./authorization.md)
