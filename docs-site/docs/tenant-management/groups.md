# Groups

This page describes how groups are used to give tenant users access to connected services. It is intended for tenant owners and user admins.

## What a group is

A **group** is a named set of tenant users within one tenant. Connected-service roles are assigned to groups, never directly to a user. Every member of a group holds every role assigned to that group.

A user can belong to any number of groups. Their effective roles are the combined roles of all their groups. A role granted by more than one group is counted once.

## Planning groups

Groups work best when they describe a job rather than a person. For example, a group named "Form designers" that holds the `form-designer` role is easier to maintain than a set of individual assignments.

A single group can hold roles from more than one connected service. This is useful for giving a new team member everything they need in one step. It also means that adding someone to that group gives them access in every one of those services, so the members of such a group should be chosen with care.

## Creating a group

A tenant owner or user admin creates a group with a name and an optional description of up to 500 characters. Group names must be unique within the tenant.

## Managing members

A tenant owner or user admin can add and remove group members at any time.

- Adding a person who is not yet a tenant user also adds them to the tenant, with the service user role.
- Adding a user who is already a member is refused.
- The person receives an email when they are added to or removed from a group. See [Email notifications](./email-notifications.md).

Removing a user from a group removes only the roles that group provided. The user keeps any roles they hold through other groups, and remains a tenant user.

## Assigning connected-service roles

A tenant owner or user admin chooses which connected-service roles a group holds. Only roles from connected services associated with the tenant are available.

Some roles are limited to certain identity providers. For example, a role limited to IDIR users does not apply to BCeID Business members of the group.

A change to a group's roles applies to every member the next time a connected service requests their roles.

## Related pages

- [Tenant users](./tenant-users.md)
- [How CSTAR works](../overview/how-cstar-works.md)
- [Tenant association](../connected-service-integration/tenant-association.md)
