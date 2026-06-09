---
sidebar_position: 6
---

# Troubleshooting access

Access issues usually come down to authentication, tenant access, connected-service setup, or role assignment.

## 401 Unauthorized

A 401 usually means CSTAR could not authenticate the request.

Common causes:

- missing bearer token
- expired token
- wrong issuer
- wrong token audience
- unsupported identity provider

## 403 Forbidden

A 403 usually means the caller was authenticated but is not allowed to perform the action.

Common causes:

- the user is not a member of the tenant
- the user does not have the required CSTAR role
- the connected service is not associated with the tenant
- the connected service is calling an API it is not allowed to use

## No effective roles returned

If no effective roles are returned, the user may not have connected-service access through CSTAR for that tenant.

Check that:

- the user belongs to the tenant
- the user is in the expected group
- the connected service is associated with the tenant
- the connected-service role is assigned to the group
- the role supports the user's identity provider

## Wrong tenant

Access is checked in the context of a tenant.

If the wrong tenant ID is used, CSTAR may return no access even if the user has access to another tenant.

## Client identifier issues

The connected service client identifier in the incoming token must match the identifier configured in CSTAR.

If the client identifier is wrong, CSTAR may not recognize the connected service or may reject access checks.
