# Connected service setup

This page describes the information CSTAR holds about a connected service and how it is maintained. It is intended for connected service teams preparing for onboarding, and for operations admins.

Connected services are set up and changed by operations admins only. A connected service team provides the details below and the operations admin enters them in each environment.

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

CSTAR identifies the calling service by matching the `aud` claim of the request token against the client identifier. The value must match exactly. A connected service cannot use the CSTAR web app's own client ID.

Each environment has its own BC Gov SSO client, so the client identifier usually differs between environments.

## Roles

A connected service is set up with between 1 and 50 roles. Roles can be added or changed later.

| Field | Required | Limit | Description |
| --- | --- | --- | --- |
| Name | Yes | 30 characters | The value the service receives, such as `form-designer`. |
| Description | No | 255 characters | Shown to tenant administrators when they assign the role. |
| Allowed identity providers | No | | Limits the role to IDIR, BCeID Business or both. If none are set, the role is available to users of any supported identity provider. |

Role names are what the connected service checks in its code, so they should not change once the service is in use.

## Status

A connected service is either active or inactive. When a service is inactive:

- its roles are not returned to it
- tenants cannot associate it
- it cannot manage access through CSTAR

An operations admin can make a service inactive and active again without losing its setup or role assignments.

## Managing access from the service

An operations admin can allow a connected service to manage tenant users and groups on behalf of the signed-in user. This setting is off by default. See [Managing access from a connected service](./managing-access.md).

## Related pages

- [Getting started](./getting-started.md)
- [Tenant association](./tenant-association.md)
- [Authentication](./authentication.md)
