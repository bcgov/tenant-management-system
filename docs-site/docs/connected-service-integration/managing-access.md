# Managing access from a connected service

This page describes how a connected service can manage tenant users and groups on behalf of its signed-in user, without sending them to the CSTAR web app. It is intended for connected service teams that want to offer access management in their own screens.

## Overview

**When this capability is turned on, a connected service can make changes in CSTAR on behalf of its signed-in user.**

Without it, a connected service can only read from CSTAR. With it, the service can also make changes, such as adding a user to the tenant or to a group. The service sends the signed-in user's own token.

**CSTAR applies the same checks as in the CSTAR web app.**

A user who cannot make a change in the web app cannot make it through a connected service. Some actions remain available in the CSTAR web app only. These are listed under [Web app only](#web-app-only).

## Requirements

| Requirement | Detail |
| --- | --- |
| Turned on for the service | An operations admin turns the capability on in the service's setup. It is off by default. |
| Service is active | The capability stops working if the service is made inactive. |
| IDIR user | The signed-in user must be an IDIR user. Requests on behalf of BCeID users are refused. |
| Tenant association | The tenant must be associated with the calling service. |
| CSTAR role | The user must hold the CSTAR role the action requires, as in the web app. See [CSTAR roles](../overview/cstar-roles.md). |

**Turning the capability off takes effect immediately.**

CSTAR checks the connected service's setup on every request.

## Available actions

| Action | Request | Rules |
| --- | --- | --- |
| View the tenant | `GET /v1/tenants/{tenantId}` | Any tenant member. |
| View the tenant's connected services | `GET /v1/tenants/{tenantId}/shared-services` | Any tenant member. |
| View a group | `GET /v1/tenants/{tenantId}/groups/{groupId}` | Any tenant member. |
| View a tenant user | `GET /v1/tenants/{tenantId}/users/{tenantUserId}` | Tenant owner or user admin. |
| View a user's CSTAR roles | `GET /v1/tenants/{tenantId}/users/{tenantUserId}/roles` | Any tenant member. |
| Search for people | `GET /v1/users/bcgovssousers/idir/search` and `/bceid/search` | Tenant owner or user admin. The `tenantId` query parameter is required. |
| Add a user to the tenant | `POST /v1/tenants/{tenantId}/users` | Tenant owner or user admin. The new user receives the service user role only. |
| Remove a user from the tenant | `DELETE /v1/tenants/{tenantId}/users/{tenantUserId}` | Tenant owner or user admin. Only users who hold no role other than service user can be removed. |
| Create or update a group | `POST /v1/tenants/{tenantId}/groups`, `PUT /v1/tenants/{tenantId}/groups/{groupId}` | Tenant owner or user admin. |
| Add a user to a group | `POST /v1/tenants/{tenantId}/groups/{groupId}/users` | Tenant owner or user admin. See [Roles in other connected services](#roles-in-other-connected-services). |
| Remove a user from a group | `DELETE /v1/tenants/{tenantId}/groups/{groupId}/users/{groupUserId}` | Tenant owner or user admin. |
| Set a group's roles | `PUT /v1/tenants/{tenantId}/groups/{groupId}/shared-services/shared-service-roles` | Tenant owner or user admin. Only the calling service's roles can be included. |

**Groups cannot be included when a user is added to the tenant through a connected service.**

The user is added to groups one at a time with the add group member request.

**The group list includes every group in the tenant.**

Once the capability is turned on, `GET /v1/tenants/{tenantId}/groups` returns every group in the tenant for IDIR users, not only the groups that hold the calling service's roles. The service can then offer the full list when adding a user to a group.

## Roles in other connected services

**Adding a user to a group through a connected service must be confirmed if it gives them new roles in another connected service.**

A group can hold roles from several connected services. Adding a user to such a group gives them access in each of those services, not only in the calling service. CSTAR refuses the request until the other services are confirmed.

1. Send the add group member request.
2. If the user would gain roles in other services, CSTAR responds with `403` and the code `OTHER_SERVICES_NOT_CONFIRMED`. The `otherServices` field lists each service and the roles the user would gain.
3. Show the list to the signed-in user and ask them to confirm.
4. Send the request again with each service's name or display name in `confirmOtherServices`.

```json
{
  "user": { "ssoUserId": "F45AFBBD68C44D6F956BA3A1D91878AD", "idpType": "idir", "...": "..." },
  "confirmOtherServices": ["Notify"]
}
```

Names in `confirmOtherServices` are matched without regard to case or spaces. Roles the user already holds through another group do not need to be confirmed.

**Removing a user from a group never requires confirmation.**

This applies even if the user loses roles in other connected services as a result.

## Web app only

**The following actions are refused when requested through a connected service.**

CSTAR responds with `403` and directs the user to the CSTAR web app.

- Requesting a tenant and reviewing tenant requests
- Updating tenant details
- Associating a connected service with a tenant
- Assigning or removing CSTAR roles, including tenant owner and user admin
- Removing a tenant owner or user admin from the tenant
- Changing another connected service's roles on a group
- Any operations admin action

## Errors

| Status | Message | Resolution |
| --- | --- | --- |
| 403 | `This connected service is not allowed to call CSTAR directly. Ask a CSTAR operations admin to enable it.` | Ask an operations admin to turn the capability on, or confirm the service is active. |
| 403 | `This operation cannot be performed from a connected service. Log in to the CSTAR web app to do this.` | The action is web app only. |
| 403 | `Only IDIR users can manage a tenant from a connected service.` | The signed-in user is not an IDIR user. |
| 403 | `This tenant does not use {service}. A tenant owner can add {service} to the tenant in the CSTAR web app.` | A tenant owner associates the service with the tenant. |
| 403 | `You need the Tenant Owner or User Admin role in this tenant to do this.` | The user does not hold the required CSTAR role. |
| 403 | `You must be a member of this tenant to do this.` | The user is not a tenant member. |
| 403 | `People added from a connected service can only be given the Service User role. ...` | Remove other roles from the request. Assign them in the web app. |
| 403 | `Only Service Users can be removed from a connected service. ...` | Remove tenant owners and user admins in the web app. |
| 403 | `{service} can only change its own roles. ...` | Include only the calling service's roles in the request. |
| 403 | `Adding {user} to this group would also give them access to ...` | See [Roles in other connected services](#roles-in-other-connected-services). |
| 400 | `When adding someone from a connected service, add them to groups one at a time ...` | Remove `groups` from the request. |
| 400 | `Searching from a connected service needs a tenant. Add tenantId to the request.` | Add the `tenantId` query parameter. |

## Auditing

**Changes made through a connected service are recorded against the signed-in user.**

They are recorded in the same way as changes made in the CSTAR web app, and users receive the same emails. See [Email notifications](../tenant-management/email-notifications.md).

## Related pages

- [Authentication](./authentication.md)
- [CSTAR roles](../overview/cstar-roles.md)
- [Groups](../tenant-management/groups.md)
