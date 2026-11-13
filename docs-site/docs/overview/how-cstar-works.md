import AccessModelDiagram from '@site/src/components/AccessModelDiagram';

# How CSTAR works

This page explains how tenant membership and group membership determine the roles a connected service receives. It is intended for tenant administrators and connected service teams.

## Access model

**A user holds a connected-service role only through membership of a group that holds it.**

<AccessModelDiagram />

A connected-service role is assigned to a group, and every member of the group holds the role. A role is given to a user by adding them to a group that holds it. It is removed by removing them from the group, or by removing the role from the group.

## Setup sequence

**Access is set up in a fixed order.**

Steps 1 and 2 are performed once. Steps 3 to 6 are repeated as tenants adopt the connected service and as people join and leave.

1. An operations admin sets up the connected service in CSTAR, together with its roles.
2. A user requests a tenant, and an operations admin approves the request. The requester becomes the first tenant owner.
3. A tenant owner associates the connected service with the tenant.
4. A tenant owner or user admin adds users to the tenant.
5. A tenant owner or user admin creates groups and adds users to them.
6. A tenant owner or user admin assigns connected-service roles to the groups.

## Role checks

**A connected service requests a user's roles for one tenant at a time.**

When a user signs in to a connected service, the service requests the user's effective roles in the selected tenant. CSTAR identifies the user's groups in that tenant and returns the roles those groups hold for the calling service. Roles for other connected services are not returned.

The connected service then determines what the user may do. CSTAR does not interpret role names.

**Changes apply to the next request.**

A change made in CSTAR, such as removing a user from a group, applies the next time the connected service requests the user's roles.

## Related pages

- [Core principles](./core-principles.md)
- [CSTAR roles](./cstar-roles.md)
- [Groups](../tenant-management/groups.md)
- [Getting started](../connected-service-integration/getting-started.md)
