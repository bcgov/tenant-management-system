# What is CSTAR

This page introduces Connected Services Team Access and Roles (CSTAR) and the people who use it. It is intended for anyone new to CSTAR.

## Purpose

**CSTAR manages which users can access a connected service, and with which roles.**

Many BC Government services require the same access model. Users belong to a team, the team is administered by a small number of people, and each user holds a set of roles in the service. CSTAR provides this model once, so that each connected service does not need to build and maintain its own.

A connected service requests the roles a user holds from CSTAR and applies those roles in its own application.

## Responsibilities

**CSTAR and the connected service each have distinct responsibilities.**

| CSTAR is responsible for | The connected service is responsible for |
| --- | --- |
| Tenants and the users who belong to them | What each role permits a user to do |
| Groups of users within a tenant | The service's own features and data |
| The connected-service roles each group holds | How the service treats a user who holds no roles |
| Who may administer each tenant | |

## Users of CSTAR

| Audience | Uses CSTAR to |
| --- | --- |
| Tenant owners and user admins | Request a tenant, add users, organize users into groups and assign connected-service roles to groups. These tasks are performed in the CSTAR web app. |
| Connected service teams | Define the roles for their service and retrieve the roles a user holds when the user signs in. |
| Operations admins | Approve tenant requests and set up connected services. |

## Related pages

- [Core principles](./core-principles.md)
- [How CSTAR works](./how-cstar-works.md)
- [CSTAR roles](./cstar-roles.md)
