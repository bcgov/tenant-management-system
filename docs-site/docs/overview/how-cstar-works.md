import AccessModelDiagram from '@site/src/components/AccessModelDiagram';

# How CSTAR works

This page explains how CSTAR turns tenant membership and groups into the roles a connected service receives. It is a starting point for both tenant administrators and connected service teams.

## Access model

<AccessModelDiagram />

Access is always granted through a group. A connected-service role is assigned to a group, and every member of that group holds the role. To give a user a role, add them to a group that holds it. To take it away, remove them from the group or remove the role from the group.

## Setting up access

The steps below show the order in which access is set up. Steps 1 and 2 are performed once. The remaining steps are repeated as people join and leave.

1. An operations admin sets up the connected service in CSTAR, together with its roles.
2. A user requests a tenant, and an operations admin approves the request. The requester becomes the first tenant owner.
3. A tenant owner associates the connected service with the tenant.
4. A tenant owner or user admin adds users to the tenant.
5. A tenant owner or user admin creates groups and adds users to them.
6. A tenant owner or user admin assigns connected-service roles to the groups.

## Checking access

When a user signs in to a connected service, the service asks CSTAR for the user's effective roles in the selected tenant. CSTAR looks at the user's groups in that tenant and returns the roles those groups hold for that connected service. Roles for other connected services are not returned.

The connected service then decides what the user can do. CSTAR does not know what a role allows inside the service.

A change made in CSTAR, such as removing a user from a group, applies the next time the connected service asks CSTAR for the user's roles.

## Related pages

- [Core concepts](./core-concepts.md)
- [CSTAR roles](./cstar-roles.md)
- [Groups](../tenant-management/groups.md)
- [Getting started](../connected-service-integration/getting-started.md)
