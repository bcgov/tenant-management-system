# Email notifications

This page lists the emails CSTAR sends and who receives them. It is intended for tenant owners, user admins and operations admins.

## Emails sent

**CSTAR emails a person when their access to a tenant or group changes, and when a tenant request is submitted or decided.**

| Event | Recipient | Content |
| --- | --- | --- |
| A tenant request is submitted | The CSTAR operations team | The request details and a link to review it |
| A tenant request is approved | The requester | The decision details and a link to sign in |
| A tenant request is rejected | The requester | The decision details, including the reason |
| A user is added to a tenant | The user | The tenant, the CSTAR roles granted and any groups |
| A user is removed from a tenant | The user | The tenant and the person who removed them |
| A user is added to a group | The user | The group, the tenant and the person who added them |
| A user is removed from a group | The user | The group, the tenant and the person who removed them |

## Emails not sent

**CSTAR does not send an email when:**

- a user's CSTAR roles change after they have been added
- the connected-service roles held by a group change
- a group is created or renamed
- a connected service is associated with a tenant

**One action produces one email.**

A user removed from a tenant receives one email for the removal, and no separate emails for the groups they were removed from. A person added to a group who was not yet a tenant user receives the "added to a tenant" email, which names the group.

## Format

**Emails are plain text and are sent through the BC Government Common Hosted Email Service (CHES).**

- Dates and times are shown in Pacific time, for example `2026-11-12 7:06 PM PST`.
- An email is sent only if CSTAR holds an email address for the recipient.

## Delivery

**An email is sent after the change is saved, and a failure to send does not affect the change.**

If an email cannot be sent, the change remains in effect and the failure is logged. CSTAR does not retry failed emails.

## Related pages

- [Tenant requests](./tenant-approval-workflow.md)
- [Tenant users](./tenant-users.md)
- [Groups](./groups.md)
