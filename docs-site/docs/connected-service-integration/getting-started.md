# Getting started

This page describes how a connected service is brought onto CSTAR, from first contact to a working integration. It is intended for connected service teams.

## What CSTAR provides

**CSTAR provides a connected service with the roles a user holds in a tenant.**

The connected service defines its roles, CSTAR stores them, and tenant owners and user admins decide who holds them. The connected service enforces the roles in its own application. It does not need to store its own records of users, teams or role assignments.

## Preparation

**The connected service team should be able to answer the following questions before onboarding.**

| Question | Reason |
| --- | --- |
| What roles does the service require? | Each role is set up in CSTAR and assigned to groups by tenant administrators. |
| Which identity providers does each role support? | A role can be limited to IDIR users, BCeID Business users or both. |
| What is the service's BC Gov SSO client ID? | CSTAR identifies the service by this value. |
| How does the service determine which tenant a user is working in? | Every role check is made for one tenant. |
| Which environment will be used for testing? | Setup is performed separately in each environment. |

## Onboarding steps

1. **Set up the connected service.** The CSTAR operations team sets up the service and its roles in each environment. See [Connected service setup](./connected-service-setup.md).
2. **Associate a test tenant.** A tenant owner of a test tenant associates the service with that tenant. See [Tenant association](./tenant-association.md).
3. **Create test access.** In the test tenant, a tenant owner or user admin creates a group, assigns one of the service's roles to it and adds a test user.
4. **Retrieve roles.** The service signs in the test user and requests their roles from CSTAR. See [Check a user's roles](./check-user-roles.md).
5. **Enforce roles.** The service determines what each role permits and enforces it.
6. **Set up production.** The service is set up in production. Production tenants associate it as they adopt it.

## Optional capabilities

**Two further capabilities are available when a connected service requires them.**

| Capability | Purpose | Page |
| --- | --- | --- |
| Managing access from a connected service | Lets the service manage users and groups in its own screens, instead of directing administrators to the CSTAR web app. | [Managing access from a connected service](./managing-access.md) |
| Tenant context assertions | Lets the service prove to another connected service which tenant a call is for. | [Tenant context assertions](./tenant-context-assertions.md) |

## Related pages

- [How CSTAR works](../overview/how-cstar-works.md)
- [Authentication](./authentication.md)
- [API reference](../reference/api-reference.md)
