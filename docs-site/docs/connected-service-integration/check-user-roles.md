---
title: Check a user's roles
---

# Check a user's roles

This page describes how a connected service retrieves the roles a user holds in a tenant. Most connected services require only this request. It is intended for developers integrating a connected service.

## Prerequisites

The request succeeds only when all of the following are in place.

- The connected service is set up in CSTAR and is active. See [Connected service setup](./connected-service-setup.md).
- The tenant is associated with the connected service. See [Tenant association](./tenant-association.md).
- The user is a member of the tenant.

## Request

```http
GET /v1/tenants/{tenantId}/ssousers/{ssoUserId}/shared-service-roles
Authorization: Bearer <the user's access token>
```

| Parameter | Value |
| --- | --- |
| `tenantId` | The tenant the user is working in. |
| `ssoUserId` | The `idir_user_guid` or `bceid_user_guid` claim from the same token. |

The `ssoUserId` must belong to the user who owns the token. A connected service cannot request another user's roles.

To let the user choose a tenant, the service can first request `GET /v1/users/{ssoUserId}/tenants`. It returns the user's tenants that are associated with the service.

## Response

```json
{
  "data": {
    "sharedServiceRoles": [
      {
        "id": "6f1c2a4e-1b7d-4c9e-9a3f-2d8e5b0c7a11",
        "name": "form-designer",
        "description": "Can create and edit forms",
        "allowedIdentityProviders": ["idir"],
        "groups": [
          { "id": "b2e4c1d0-5a6f-4e3b-8c2d-1f0e9a8b7c6d", "name": "Form builders" },
          { "id": "c9a1f3e2-7b4d-4a5c-9e8f-2d1c0b3a4e5f", "name": "Program admins" }
        ]
      }
    ]
  }
}
```

| Field | Description |
| --- | --- |
| `name` | The role name. This is the value the connected service checks. |
| `allowedIdentityProviders` | The identity providers the role is limited to, or `null` if it is not limited. |
| `groups` | Every group that gives the user this role. |

The response follows these rules:

- **Only the calling service's roles.** Roles the user holds in other connected services are not included.
- **Each role once.** A role granted by more than one group appears once, with all of those groups listed.
- **Identity provider limits applied.** A role limited to IDIR users is not returned for a BCeID Business user, even if they are in a group that holds it.

What each role allows is decided by the connected service. CSTAR does not interpret role names.

## Empty response

An empty `sharedServiceRoles` list is a valid response. It indicates that the user is a member of the tenant but does not belong to any group that holds a role for the calling service.

The connected service should treat the user as having no access, and should tell them how to obtain it. For example: "You do not have access to this service in this tenant. Ask a tenant owner or user admin to add you to a group."

## Errors

| Status | Message | Cause | Resolution |
| --- | --- | --- | --- |
| 401 | `Error occurred during authentication` | The token is missing, expired or not issued by BC Gov SSO, or its `aud` is not a single value. | Obtain a new token. Confirm the `aud` claim. |
| 403 | `Shared service not authorized for this tenant` | The tenant is not associated with the calling service. | A tenant owner associates the service with the tenant. |
| 403 | `Access denied: User does not have required roles for tenant: {tenantId}` | The user is not a member of the tenant. | Confirm the tenant ID. A tenant owner or user admin adds the user. |
| 403 | `Access denied - the requested user does not match the token user` | The `ssoUserId` in the path is not the token's user. | Take `ssoUserId` from the token. |

See [Troubleshooting access](./troubleshooting-access.md) for other errors.

## Caching

A connected service can cache the response to avoid a request on every page. A change made in CSTAR, such as removing a user from a group, does not reach the service until it requests the roles again. The cache period should therefore be short, such as the length of the user's session or a few minutes.

## Related pages

- [Authentication](./authentication.md)
- [Groups](../tenant-management/groups.md)
- [Troubleshooting access](./troubleshooting-access.md)
