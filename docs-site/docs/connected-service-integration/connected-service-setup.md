# Connected service setup

This page describes the information CSTAR holds about a connected service and how it is maintained. It is intended for connected service teams preparing for onboarding, and for operations admins.

## Responsibility

**Only operations admins can set up or change a connected service.**

The connected service team provides the details below, and an operations admin enters them in each environment.

## Service details

| Field | Required | Limit | Description |
| --- | --- | --- | --- |
| Name | Yes | 30 characters | A short internal name, such as `notify`. |
| Display name | Yes | 100 characters | The name shown to tenant administrators, such as `Notify`. |
| Client identifier | Yes | 55 characters | The service's BC Gov SSO client ID. |
| Landing page URL | Yes | 500 characters | The address users are sent to from CSTAR. |
| Description | No | 500 characters | A short description shown to tenant administrators. |

Names, display names and client identifiers must not start or end with a space.

## Client identifier

**CSTAR identifies the calling service by matching the token's `aud` claim to the client identifier.**

The two values must match exactly. Each environment has its own BC Gov SSO client, so the client identifier normally differs between environments.

**A connected service cannot use the CSTAR web app's client ID.**

## Roles

**A connected service has between 1 and 50 roles.**

Roles can be added or changed after setup.

| Field | Required | Limit | Description |
| --- | --- | --- | --- |
| Name | Yes | 30 characters | The value the service receives, such as `form-designer`. |
| Description | No | 255 characters | Shown to tenant administrators when they assign the role. |
| Allowed identity providers | No | | Limits the role to IDIR, BCeID Business or both. Users who sign in with Azure IDIR are treated as IDIR users. If none are set, the role is available to users of any supported identity provider. |

**Role names should not change once the connected service is in use.**

The connected service checks role names in its code. Renaming a role breaks those checks.

## Status

**A connected service is either active or inactive.**

When a connected service is inactive:

- its roles are not returned to it
- tenants cannot associate it
- it cannot manage access through CSTAR

An operations admin can make a connected service inactive and active again without losing its setup or role assignments.

## Managing access from the service

**A connected service can only read from CSTAR unless an operations admin permits it to manage access.**

This setting is off by default. See [Managing access from a connected service](./managing-access.md).

## Service accounts

**A connected service can read groups and their members without a signed-in user only if an operations admin permits it.**

| Field | Required | Limit | Description |
| --- | --- | --- | --- |
| Allow service accounts | No | | Permits the service to use a service account. Off by default. Managing access must also be turned on. |
| Service account client identifier | No | 55 characters | The BC Gov SSO client ID of the service account's own integration. It must differ from the service's client identifier and be unique across all connected services. |

An operations admin sets these fields when the connected service is created, `POST /v1/shared-services`, or later with the update connected service request, `PUT /v1/shared-services/{sharedServiceId}`. They are not shown in the CSTAR web app. See [Service accounts](./service-accounts.md).

## Related pages

- [Getting started](./getting-started.md)
- [Tenant association](./tenant-association.md)
- [Authentication](./authentication.md)
