# Authorization

This page describes the checks CSTAR makes before it allows a request. It is intended for connected service teams and for anyone reviewing how CSTAR controls access.

## Order of checks

**CSTAR allows a request only if it passes every check that applies to it.**

| # | Check | Applies to | Refused with |
| --- | --- | --- | --- |
| 1 | The token is valid, unexpired and issued by BC Gov SSO. | Every request except the health check and signing keys | 401 |
| 2 | The `aud` claim is a single value that identifies the CSTAR web app or a connected service. | Every request | 401 or 403 |
| 3 | The user's identity provider is accepted for the request. | Every request with a user | 401 or 403 |
| 4 | The request is permitted for the type of token. | Every request | 403 |
| 5 | Any user identifier in the path is the token's user. | Requests that include `{ssoUserId}` | 403 |
| 6 | The calling connected service is associated with the tenant. | Tenant requests from a connected service | 403 |
| 7 | The user is a member of the tenant. | Every tenant request | 403 |
| 8 | The user holds the CSTAR role the action requires. | Changes within a tenant | 403 |
| 9 | Any business rule for the action is met, such as keeping a tenant owner. | Changes | 409 |

## Token type

**The token's `aud` claim determines which requests are permitted.**

| Token type | Permitted requests |
| --- | --- |
| CSTAR token | All requests, subject to the user's CSTAR roles. |
| Connected-service token | Read requests about tenants associated with the service. |
| Connected-service token, with managing access permitted | The above, plus the changes listed in [Managing access from a connected service](../connected-service-integration/managing-access.md). |

See [Authentication](../connected-service-integration/authentication.md).

## Tenant membership and CSTAR roles

**Every tenant request requires the user to be a member of the tenant.**

Viewing the tenant requires membership only. Changes require the tenant owner or user admin role, and some changes require the tenant owner role. See [CSTAR roles](../overview/cstar-roles.md).

## Operations admin

**Operations admin actions require a CSTAR token that carries the operations admin role.**

The role is read from the token, where it is assigned through the CSTAR client in BC Gov SSO. Operations admin actions cannot be performed with a connected-service token.

**The operations admin role gives no access inside a tenant.**

An operations admin who needs access to a tenant must be added to it as a tenant user.

## Connected-service roles

**A connected service receives only its own roles, after identity provider limits are applied.**

See [Check a user's roles](../connected-service-integration/check-user-roles.md).

## Related pages

- [Core principles](../overview/core-principles.md)
- [Identity providers](./identity-providers.md)
- [Troubleshooting access](../connected-service-integration/troubleshooting-access.md)
