# Tenant context assertions

This page describes how one connected service proves to another which tenant a call is for. It is intended for teams whose connected service calls, or is called by, another connected service.

## Purpose

**A receiving service must not rely on a tenant ID supplied by the calling service.**

When one connected service calls another, the receiving service needs to know which tenant the call is for, and whether the caller may act in that tenant. A tenant ID in the request can be set to any value.

A **tenant context assertion** is a short-lived token signed by CSTAR. It states the tenant, the calling service and, where there is one, the user. The receiving service asks CSTAR to verify it before acting on the call.

## Flow

1. The calling service requests an assertion from CSTAR for the tenant and the receiving service.
2. CSTAR checks that both services are associated with the tenant, and that the user, if any, is a member of it. It then returns a signed assertion.
3. The calling service sends the assertion to the receiving service in the `X-CSTAR-Assertion` header.
4. The receiving service asks CSTAR to verify the assertion.
5. CSTAR confirms the assertion and returns the tenant, the calling service and the user.

## Requesting an assertion

```http
POST /v1/tenants/{tenantId}/assertions
Authorization: Bearer <calling service's token>
Content-Type: application/json

{ "audience": "notify-6388" }
```

| Field | Description |
| --- | --- |
| `audience` | The client identifier of the receiving service. |

The calling service is identified from the `aud` claim of its token. If the token belongs to a user, that user is included in the assertion and must be a member of the tenant.

```json
{
  "data": {
    "assertion": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2026-09-18T19:45:00.000Z"
  }
}
```

**An assertion is short-lived.**

An assertion is valid until the time given in `expiresAt`, which is 5 minutes after it is issued unless the environment is configured otherwise. The calling service should request a new assertion for each call or group of calls, rather than store one.

## Verifying an assertion

```http
GET /v1/assertions/verify
Authorization: Bearer <receiving service's token>
X-CSTAR-Assertion: <assertion>
```

```json
{
  "data": {
    "valid": true,
    "tenantId": "b89c58cc-c886-4851-ae07-59bf2dab6d84",
    "azp": "chefs-frontend-5299",
    "sub": "F45AFBBD68C44D6F956BA3A1D91878AD"
  }
}
```

| Field | Description |
| --- | --- |
| `tenantId` | The tenant the assertion was issued for. |
| `azp` | The client identifier of the calling service. |
| `sub` | The user the assertion was issued for. Absent when the calling service acted without a user. |

**CSTAR checks the tenant relationships again at the time of verification.**

An assertion stops verifying as soon as the calling service or the user leaves the tenant, even before it expires.

**The receiving service must verify with its own token.**

An assertion issued for one service cannot be verified by another.

## Errors

| Status | Cause |
| --- | --- |
| 400 | The `X-CSTAR-Assertion` header is missing or malformed. |
| 401 | The assertion is not valid, has expired or was issued for another service. |
| 403 | A service or the user is not associated with the tenant, or is no longer associated with it. |

## Signing keys

**Assertions should be verified through CSTAR, not with the signing keys alone.**

CSTAR publishes the public keys used to sign assertions at `GET /v1/.well-known/jwks.json`. This endpoint does not require a token. Checking the signature confirms only that CSTAR issued the assertion. Only CSTAR can confirm that the tenant relationships are still current.

## Related pages

- [Authentication](./authentication.md)
- [Tenant association](./tenant-association.md)
