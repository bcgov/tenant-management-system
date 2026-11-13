# API reference

This page explains where to find the full CSTAR API specification. It is intended for developers integrating a connected service.

## Specification

**The CSTAR API is defined by its OpenAPI specification.**

The specification gives the exact path, parameters, request body, response and errors for every request. This documentation site explains concepts, rules and integration steps, and links to the specification for detail.

## Interactive API documentation

**Each environment publishes the specification as interactive documentation.**

| Environment | Address |
| --- | --- |
| Development | [https://cstar-dev.apps.gold.devops.gov.bc.ca/docs/](https://cstar-dev.apps.gold.devops.gov.bc.ca/docs/) |
| Test | [https://cstar-test.apps.gold.devops.gov.bc.ca/docs/](https://cstar-test.apps.gold.devops.gov.bc.ca/docs/) |
| Local | `http://localhost:4144/docs` when the backend is running locally |

## Request format

**All requests and responses use JSON.**

- Every request except the health check and signing keys requires a bearer token. See [Authentication](../connected-service-integration/authentication.md).
- Successful responses wrap their content in a `data` object.
- Errors use the standard format described in [Troubleshooting access](../connected-service-integration/troubleshooting-access.md).
- Dates and times are returned in UTC, in ISO 8601 format.

## Related pages

- [Authentication](../connected-service-integration/authentication.md)
- [Check a user's roles](../connected-service-integration/check-user-roles.md)
- [Glossary](./glossary.md)
