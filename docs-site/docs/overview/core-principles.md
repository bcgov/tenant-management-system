# Core principles

This page sets out the principles on which CSTAR is designed. Each principle is stated in bold, followed by the reason for it and its implications for tenant administrators and connected services. It is intended for anyone who uses, integrates with or reviews CSTAR.

Terms used on this page are defined in the [Glossary](../reference/glossary.md).

## Summary

| # | Principle | Statement |
| --- | --- | --- |
| 1 | Tenant separation | Each tenant is managed independently of every other tenant. |
| 2 | Group-based role assignment | Connected-service roles are assigned to groups, not to individual users. |
| 3 | Separation of role management and enforcement | CSTAR manages which users hold a role. The connected service determines what the role permits. |
| 4 | Tenant-controlled service association | A connected service has no access to a tenant until a tenant owner associates it. |
| 5 | Service-scoped data | A connected service receives only its own roles, for tenants associated with it. |
| 6 | Token-derived identity | CSTAR identifies the user from the signed token, not from the request. |
| 7 | Minimum default access | Users and connected services receive the least access until it is extended. |
| 8 | Consistent rules across channels | The same access rules apply in the CSTAR web app and through a connected service. |
| 9 | Confirmation of cross-service access | Granting roles in other connected services through a connected service requires confirmation. |
| 10 | Tenant ownership continuity | Every tenant has at least one tenant owner at all times. |
| 11 | Immediate effect of changes | Changes made in CSTAR apply to the next request. |
| 12 | Notification and accountability | Users are notified of changes to their access, and each change is recorded against the person who made it. |

## 1. Tenant separation

**Each tenant is managed independently of every other tenant.**

Different teams manage their own people and must not see or affect the users, groups or role assignments of another team.

- Users, groups and role assignments in one tenant have no effect in another tenant.
- A person who belongs to more than one tenant can hold different roles in each.
- Every role check is made for one tenant, and a connected service must state which tenant it is asking about.

## 2. Group-based role assignment

**Connected-service roles are assigned to groups. They are not assigned to individual users.**

Access is usually determined by a person's job rather than by the person. Assigning roles to groups allows access for a job to be defined once and applied to every person who holds that job. It also reduces the number of individual assignments that must be reviewed and maintained.

- A user receives a connected-service role only by belonging to a group that holds it.
- A role is removed from a user by removing them from the group, or by removing the role from the group.
- A user's effective roles can be traced to the groups they belong to.

## 3. Separation of role management and enforcement

**CSTAR manages which users hold a role. The connected service determines what the role permits.**

Each connected service is the authority on its own features and data. Keeping that knowledge in the connected service allows services to change their features without any change to CSTAR.

- CSTAR returns role names, such as `form-designer`, and does not interpret them.
- The connected service is responsible for enforcing what each role permits.
- The connected service is responsible for deciding how to treat a user who holds none of its roles.

## 4. Tenant-controlled service association

**A connected service has no access to a tenant until a tenant owner associates the service with the tenant.**

A tenant decides which connected services may read its users and groups and receive role assignments.

- A connected service's roles cannot be assigned to groups in a tenant that has not associated it.
- Requests from a connected service about a tenant that has not associated it are refused.
- Only a tenant owner can associate a connected service with a tenant.

## 5. Service-scoped data

**A connected service receives only its own roles, and only for tenants associated with it.**

A connected service has no need to know what a user may do in other connected services, or which tenants do not use it.

- A user's roles in other connected services are not returned to the calling service.
- A list of a user's tenants includes only the tenants associated with the calling service.
- A list of a tenant's groups includes only the groups that hold the calling service's roles, unless the service is permitted to manage access.

## 6. Token-derived identity

**CSTAR identifies the user from the signed token, not from a user identifier supplied in the request.**

A user identifier in a request can be set to any value. The token is signed by BC Gov SSO and cannot be altered by the connected service.

- A connected service can request information only about the user who owns the token.
- A request that names a different user is refused.
- Changes are attributed to the user identified in the token.

## 7. Minimum default access

**Users and connected services receive the least access needed, until a person with the appropriate role extends it.**

Access that has not been granted cannot be misused. Extending access should be a decision made by an accountable person.

- BCeID Business users can hold the service user role only.
- A connected service can only read from CSTAR until an operations admin permits it to manage access.
- People added to a tenant through a connected service receive the service user role only. Other CSTAR roles are assigned in the CSTAR web app.

## 8. Consistent rules across channels

**The same access rules apply whether a request is made in the CSTAR web app or through a connected service.**

A user's permissions should not depend on the application they use to make a change.

- Tenant membership and CSTAR roles are checked on every request, regardless of its source.
- A user cannot perform an action through a connected service that they cannot perform in the CSTAR web app.
- Tenant administration tasks, such as assigning tenant owners and approving tenant requests, are available in the CSTAR web app only.

## 9. Confirmation of cross-service access

**Adding a user to a group through a connected service requires confirmation when it would give the user new roles in other connected services. Removing access never requires confirmation.**

A group can hold roles in several connected services. The person making a change in one connected service may not be aware of the access the group gives in others. Unintended access is a greater risk than unintended removal.

- CSTAR refuses the request and lists the other connected services and roles involved.
- The request succeeds when it is sent again with those connected services named in `confirmOtherServices`.
- Removing a user from a group takes effect without confirmation, even if they lose roles in other connected services.

See [Managing access from a connected service](../connected-service-integration/managing-access.md).

## 10. Tenant ownership continuity

**Every tenant has at least one tenant owner at all times.**

A tenant without a tenant owner cannot be fully managed. No one would be able to update the tenant details or associate connected services.

- The tenant owner role cannot be removed from the last tenant owner.
- The last tenant owner cannot be removed from the tenant.
- A new tenant owner must be assigned before the current one is removed.

## 11. Immediate effect of changes

**A change made in CSTAR applies to the next request a connected service makes.**

When access is removed, it should stop being effective as soon as possible.

- CSTAR does not delay or batch changes.
- Where a connected service caches a user's roles, a change is not visible in that service until the cache is refreshed.
- Connected services should keep cache periods short.

## 12. Notification and accountability

**Users are notified when their access changes, and each change is recorded against the person who made it.**

Users should be aware of changes to their own access. Administrators and auditors must be able to determine who made a change.

- Users receive an email when they are added to or removed from a tenant or a group.
- Changes made through a connected service are recorded against the signed-in user, not the connected service.
- Emails are sent after a change is saved. A failure to send an email does not prevent the change.

See [Email notifications](../tenant-management/email-notifications.md).

## Related pages

- [How CSTAR works](./how-cstar-works.md)
- [CSTAR roles](./cstar-roles.md)
- [Glossary](../reference/glossary.md)
