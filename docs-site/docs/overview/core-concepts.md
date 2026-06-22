---
sidebar_position: 2
---

# Core concepts

Following are some CSTAR specific terms that help clarify how CSTAR operates.

## Tenant

A tenant is the access boundary in CSTAR.

It usually represents a program, organization, business area, or service context where users need to be managed separately from other users.

## Tenant user

A tenant user is a user who belongs to a tenant.

Tenant users can have roles in CSTAR and can be added to groups inside the tenant.

## CSTAR role

A CSTAR role controls what a user can do in CSTAR.

Examples include tenant owner, user admin, and service user. These roles are about managing access in CSTAR. They are not the same as roles inside a connected service.

## Group

A group is a collection of tenant users.

Groups are used to manage access for more than one user at a time. A connected-service role can be assigned to a group, and users in that group receive that role for the connected service.

## Connected service

A connected service is an application or service that uses CSTAR for tenant and role information.

The connected service still owns its own application behavior. CSTAR provides the tenant, group, and role data that the service can use when making access decisions.

## Connected-service role

A connected-service role is a role defined by a connected service.

For example, a connected service may define roles such as viewer, editor, or administrator. CSTAR can assign those roles to tenant groups.

## Effective roles

Effective roles are the connected-service roles a user receives after CSTAR looks at the user's tenant, group membership, and the roles assigned to those groups.

Connected services use effective roles to understand what access a user should have in that service.
