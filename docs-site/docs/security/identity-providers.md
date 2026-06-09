---
sidebar_position: 1
---

# Identity providers

CSTAR uses BC Government identity providers for authentication.

CSTAR does not authenticate users itself. Users sign in through a supported identity provider, and CSTAR uses the identity information from that sign-in when managing tenant access.

## IDIR

IDIR is used for CSTAR administration and tenant request workflows.

Tenant requests are for IDIR users only. CSTAR operations admins are also expected to be IDIR users.

## BCeID Business

BCeID Business users may be used in connected-service access flows where that identity type is supported.

BCeID Business users are not used for CSTAR operations administration.

## Basic BCeID

Basic BCeID is not supported.

Users should not be onboarded to CSTAR with Basic BCeID, and connected-service role setup should not depend on Basic BCeID users.

## Identity provider and roles

The identity provider tells CSTAR who the user is.

CSTAR roles and connected-service roles are still managed in CSTAR. Signing in with a supported identity provider does not automatically give a user tenant access or connected-service access.
