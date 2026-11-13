# Troubleshooting access

This page explains the errors CSTAR returns and how to resolve them. It is intended for connected service developers and for anyone helping a user who cannot access a connected service.

## Error response format

**CSTAR returns errors in a standard format.**

```json
{
  "name": "Authorization Failure",
  "message": "Access denied: User does not have required roles for tenant: b89c58cc-c886-4851-ae07-59bf2dab6d84",
  "httpResponseCode": 403,
  "errorMessage": "Forbidden"
}
```

| Field | Description |
| --- | --- |
| `name` | A short label for the kind of failure. |
| `message` | What went wrong. Where possible, the message also states what to do. |
| `httpResponseCode` | The HTTP status code. |
| `errorMessage` | The standard name of the HTTP status. |
| `code` | Present on some errors. A fixed value the connected service can test for, such as `OTHER_SERVICES_NOT_CONFIRMED`. |

**A connected service should test `code`, not the wording of `message`.**

The wording of `message` can change. The value of `code` does not.

The error for a mismatched user ID currently uses a different format: `{ "error", "message", "statusCode" }`.

## Status codes

| Status | Meaning | Common causes |
| --- | --- | --- |
| 400 | The request is not valid. | A required field is missing, a value is too long, or an ID is not in the expected format. The `message` names the field. |
| 401 | CSTAR did not accept the token. | The token is missing or expired, or was not issued by BC Gov SSO. On some requests, an `aud` claim that does not match a known client also returns 401. |
| 403 | The caller is identified but not allowed to do this. | See [403 Forbidden](#403-forbidden). |
| 404 | The tenant, user, group or role was not found. | The ID is wrong, belongs to another tenant, or the item was removed. |
| 409 | The request conflicts with existing data. | The item already exists, or the change would break a rule such as leaving a tenant without a tenant owner. |
| 500 | CSTAR failed unexpectedly. | Retry once. If it persists, contact the CSTAR team with the time of the request. |

## 403 Forbidden

| Message contains | Cause | Resolution |
| --- | --- | --- |
| `Shared service not authorized for this tenant` | The tenant is not associated with the calling service. | A tenant owner associates the service with the tenant. |
| `User does not have required roles for tenant` | The user is not a member of the tenant, or lacks the CSTAR role the action requires. | Confirm the tenant ID. A tenant owner or user admin adds the user or gives them the role. |
| `the requested user does not match the token user` | The user ID in the path is not the token's user. | Take the user ID from the token. |
| `not allowed to call CSTAR directly` | The service has not been allowed to manage access. | See [Managing access from a connected service](./managing-access.md). |
| `cannot be performed from a connected service` | The action is available in the CSTAR web app only. | Perform the action in the CSTAR web app. |
| `required role: TMS.OPERATIONS_ADMIN` | The action is for operations admins only. | Contact the CSTAR team. |

## A user has no roles

**When a connected service receives an empty list of roles, check the following in order.**

1. **Tenant.** The service is asking about the tenant the user expects.
2. **Membership.** The user is a member of that tenant.
3. **Association.** The tenant is associated with the connected service.
4. **Group.** The user belongs to a group in that tenant.
5. **Role assignment.** That group holds a role in the connected service.
6. **Identity provider.** The role is available to the user's identity provider. A role limited to IDIR users is not returned for a BCeID Business user.
7. **Service status.** The connected service is active.

## A change has not taken effect

**CSTAR applies changes immediately.**

If a user's access in a connected service does not reflect a recent change, check whether the connected service caches the user's roles. The connected service team can confirm how long roles are cached and how to refresh them.

## Client identifier problems

**Most client identifier problems are caused by one of the following.**

- The `aud` claim must exactly match the client identifier set up in CSTAR. Client IDs differ between environments.
- The `aud` claim must be a single value. Tokens with several audiences are refused.
- A connected service cannot be set up with the CSTAR web app's client ID.

## Related pages

- [Authentication](./authentication.md)
- [Check a user's roles](./check-user-roles.md)
- [Managing access from a connected service](./managing-access.md)
