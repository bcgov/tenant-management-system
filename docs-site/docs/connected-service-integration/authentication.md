# Authentication

This page describes the tokens CSTAR accepts and what each one can be used for. It is intended for connected service teams.

## Token requirements

**Every request to CSTAR must include a bearer token issued by BC Gov SSO.**

The health check and the public signing keys are the only exceptions.

```http
Authorization: Bearer <access token>
```

CSTAR checks the token's signature, issuer and expiry. It then reads two things from the token:

| Claim | Used for |
| --- | --- |
| `aud` | Identifying the caller. It must be a single value, not a list. |
| `idir_user_guid` or `bceid_user_guid` | Identifying the signed-in user. |

## Token types

**CSTAR treats a token according to its `aud` claim.**

| Token type | `aud` value | Who uses it | Identity providers |
| --- | --- | --- | --- |
| CSTAR token | The CSTAR web app's client ID | The CSTAR web app | IDIR only |
| Connected-service token | The connected service's client ID | A connected service, on behalf of its signed-in user | IDIR and BCeID Business |

**A connected service sends the token it already holds for its signed-in user.**

A separate token for CSTAR is not required.

## Connected-service token permissions

**A connected-service token can read information about tenants associated with the calling service.**

| Request | Purpose |
| --- | --- |
| `GET /v1/users/{ssoUserId}/tenants` | The user's tenants that are associated with this service. Used to let the user choose a tenant. |
| `GET /v1/tenants/{tenantId}/ssousers/{ssoUserId}/shared-service-roles` | The user's roles in this service. See [Check a user's roles](./check-user-roles.md). |
| `GET /v1/tenants/{tenantId}/users/{ssoUserId}/groups/shared-service-roles` | The user's groups and the roles each group gives them in this service. |
| `GET /v1/tenants/{tenantId}/ssousers/{ssoUserId}/roles` | The user's CSTAR roles in the tenant. |
| `GET /v1/tenants/{tenantId}/users` | The tenant's users. |
| `GET /v1/tenants/{tenantId}/groups` | The tenant's groups that hold a role in this service. |
| `GET /v1/tenants/{tenantId}/groups/{groupId}/shared-services/shared-service-roles` | The roles a group holds in this service. |

**Requests that include `{ssoUserId}` can only ask about the user who owns the token.**

If an operations admin has permitted the connected service to manage access, the same token can also make changes. See [Managing access from a connected service](./managing-access.md).

## Checks on every request

**A valid token does not by itself give access to a tenant.**

For each tenant-specific request, CSTAR also checks that:

1. the calling service is associated with the tenant
2. the signed-in user is a member of the tenant
3. for a change, the user holds the CSTAR role the change requires

## Related pages

- [Connected service setup](./connected-service-setup.md)
- [Troubleshooting access](./troubleshooting-access.md)
- [API reference](../reference/api-reference.md)
