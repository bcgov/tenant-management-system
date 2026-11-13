# Groups

This page describes how groups are used to give tenant users access to connected services. It is intended for tenant owners and user admins.

## Definition

**A group is a named set of tenant users within one tenant.**

Connected-service roles are assigned to groups, never directly to a user. Every member of a group holds every role assigned to that group.

**A user's effective roles are the combined roles of all their groups.**

A user can belong to any number of groups. A role granted by more than one group is counted once.

## Group design

**A group should represent a job or function, not an individual.**

A group defined by function, such as "Form designers", remains valid as people join and leave. Access can then be reviewed by group rather than by person.

**A group can hold roles in more than one connected service.**

Adding a user to such a group gives them access in every one of those connected services. Groups of this kind should be limited to people who require access in all of them.

## Creating a group

**Tenant owners and user admins create groups.**

| Field | Required | Limit |
| --- | --- | --- |
| Name | Yes | 255 characters. Must be unique within the tenant, and must not start or end with a space. |
| Description | No | 500 characters |

## Group membership

**Tenant owners and user admins can add and remove group members at any time.**

- Adding a person who is not yet a tenant user also adds them to the tenant, with the service user role.
- Adding a user who is already a member is refused.
- The person receives an email when they are added to or removed from a group. See [Email notifications](./email-notifications.md).

**Removing a user from a group removes only the roles that group provided.**

The user keeps any roles they hold through other groups, and remains a tenant user.

## Connected-service roles

**Tenant owners and user admins assign connected-service roles to groups.**

Only roles from connected services associated with the tenant can be assigned.

**Identity provider limits are applied to each member.**

A role limited to IDIR users is not given to BCeID Business members of the group.

**A change to a group's roles applies to every member.**

The change takes effect the next time a connected service requests a member's roles.

## Related pages

- [Tenant users](./tenant-users.md)
- [How CSTAR works](../overview/how-cstar-works.md)
- [Tenant association](../connected-service-integration/tenant-association.md)
