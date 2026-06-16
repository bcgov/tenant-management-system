---
sidebar_position: 2
---

# Authentication

CSTAR APIs use bearer tokens.

The token must come from a supported BC Government identity provider and must have the expected audience for the API being called.

## CSTAR audience token

Most CSTAR administration APIs require a CSTAR audience token.

These APIs are used for actions such as tenant administration, user management, group management, tenant approvals, and connected-service setup.

## Connected-service audience token

Some APIs are available to connected services.

For those APIs, the token audience identifies the connected service calling CSTAR. CSTAR uses that audience to check whether the connected service is allowed to access information for the requested tenant.

## Tenant access

Authentication only proves who is calling CSTAR.

CSTAR still checks tenant access before returning tenant-specific information. A valid token does not automatically grant access to every tenant.

## User identity

CSTAR uses identity information from the token when checking access.

Connected services should not send user identity as trusted input if CSTAR can derive it from the token or validate it against CSTAR data.
