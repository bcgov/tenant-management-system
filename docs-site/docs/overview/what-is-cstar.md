# What is CSTAR

Connected Services Team Access and Roles (CSTAR) is a BC Government service that manages who can use a connected service, and with which roles. This page introduces CSTAR and the people who use it.

## Purpose

Many BC Government services need the same access model. Users belong to a team, the team is managed by a few administrators, and each user holds a set of roles in the service.

CSTAR provides that model once, so that each connected service does not need to build and maintain its own. A connected service asks CSTAR which roles a user holds and then applies those roles in its own application.

## What CSTAR manages

| CSTAR manages | The connected service manages |
| --- | --- |
| Tenants and the users who belong to them | What each role allows a user to do |
| Groups of users within a tenant | The service's own data and features |
| Which connected-service roles each group holds | How the service responds to a user with no roles |
| Who can administer each tenant | |

## Who uses CSTAR

| Audience | Uses CSTAR to |
| --- | --- |
| Tenant owners and user admins | Request a tenant, add users, organize them into groups and give groups connected-service roles. These tasks are performed in the CSTAR web app. |
| Connected service teams | Define the roles for their service and retrieve the roles a user holds when the user signs in. |
| Operations admins | Approve tenant requests and set up connected services. |

## Related pages

- [Core concepts](./core-concepts.md)
- [How CSTAR works](./how-cstar-works.md)
- [CSTAR roles](./cstar-roles.md)
