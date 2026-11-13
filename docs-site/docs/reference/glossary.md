# Glossary

This page defines the terms used throughout the CSTAR documentation. Each term has the same meaning on every page.

## Connected service

An application that relies on CSTAR for its tenant and role information. An operations admin sets up each connected service in CSTAR, together with the roles it uses. See [Connected service setup](../connected-service-integration/connected-service-setup.md).

## Connected-service role

A role defined by a connected service, such as `viewer` or `form-designer`. Each connected service has its own roles. Connected-service roles are given to groups, never directly to a user. A role can be limited to certain identity providers.

## CSTAR role

A role that controls what a tenant user can do in CSTAR itself. The CSTAR roles are tenant owner, user admin and service user. A CSTAR role has no meaning inside a connected service. See [CSTAR roles](../overview/cstar-roles.md).

## Effective roles

The connected-service roles a user has in one tenant for one connected service. CSTAR works them out from the groups the user belongs to and the roles those groups have. A role given by more than one group is counted once. See [Check a user's roles](../connected-service-integration/check-user-roles.md).

## Group

A named set of tenant users within one tenant. Every member of a group has every connected-service role given to the group. See [Groups](../tenant-management/groups.md).

## Identity provider

The service a person signs in with. CSTAR supports IDIR and BCeID Business. See [Identity providers](../security/identity-providers.md).

## Operations admin

A member of the CSTAR operations team. Operations admins approve tenant requests and set up connected services. The role applies to CSTAR as a whole, not to one tenant.

## Service user

A CSTAR role that gives read-only access to a tenant in CSTAR. BCeID Business users can only be service users.

## Tenant

A team, program or business area whose access to connected services is managed together. Each tenant has its own users, groups and role assignments. See [Tenants](../tenant-management/tenants.md).

## Tenant association

The link between a tenant and a connected service. A tenant owner creates it by adding the connected service to the tenant. See [Tenant association](../connected-service-integration/tenant-association.md).

## Tenant context assertion

A short-lived token signed by CSTAR that tells one connected service which tenant a call from another connected service is for. See [Tenant context assertions](../connected-service-integration/tenant-context-assertions.md).

## Tenant owner

A CSTAR role for the people responsible for a tenant. Every tenant has at least one tenant owner.

## Tenant request

A request from an IDIR user for a new tenant. An operations admin approves or rejects it. See [Tenant requests](../tenant-management/tenant-approval-workflow.md).

## Tenant user

A person who has been added to a tenant. Signing in to CSTAR or a connected service does not make a person a tenant user. See [Tenant users](../tenant-management/tenant-users.md).

## User admin

A CSTAR role for people who manage users and groups in a tenant day to day.
