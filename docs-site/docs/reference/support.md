# Support

This page explains how to obtain help with CSTAR. It is intended for tenant administrators and connected service teams.

## Contact

**The CSTAR team can be contacted at [Connect_support@gov.bc.ca](mailto:Connect_support@gov.bc.ca).**

The CSTAR web app is available at [https://connect.digital.gov.bc.ca/](https://connect.digital.gov.bc.ca/).

## Requests handled by the CSTAR team

| Request | Information to include |
| --- | --- |
| Onboarding a connected service | The answers to the questions in [Getting started](../connected-service-integration/getting-started.md#preparation). |
| Changing a connected service or its roles | The service name, the environment and the change required. |
| Allowing a connected service to manage access | The service name, the environment and the reason. See [Managing access from a connected service](../connected-service-integration/managing-access.md). |
| A tenant request that has not been decided | The tenant name and the date of the request. |
| An unexpected error | See [Reporting an error](#reporting-an-error). |

## Access to a tenant

**Access to a tenant is granted by that tenant's owners and user admins, not by the CSTAR team.**

A user who needs to join a tenant, join a group or receive a role should contact a tenant owner or user admin of the tenant. The CSTAR team can help only when a tenant has no available tenant owner.

## Reporting an error

**An error report should include enough detail to find the request.**

- the environment
- the date and time of the request, including the time zone
- the request method and path, such as `GET /v1/tenants/{tenantId}/users`
- the status code and the `message` from the response

**Tokens must never be included in an error report.**

A token gives access to CSTAR on the user's behalf until it expires.

## Related pages

- [Troubleshooting access](../connected-service-integration/troubleshooting-access.md)
- [Getting started](../connected-service-integration/getting-started.md)
- [API reference](./api-reference.md)
