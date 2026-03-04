# Integration Tests

Bruno-based API integration tests. The intention of these is to test the
integration of:

- The API middleware
- The API route layer
- The API controller layer
- The API service layer
- The API ORM layer
- The database

What is important is the ommission of Keycloak/SSO, which is explicitly out of
scope for these tests.

> Note: These tests are _currently_ a proof of concept. They do not create,
> modify, or delete data, and will remain so until they are expanded to run
> against an ephemeral database.

## Running Locally

These tests can be run locally:

- run `npm ci`
- start the backend (`Run and Debug` in Activity Bar > `CSTAR` or
  `CSTAR Backend`)
- run `npm test`

## Running in GitHub Actions

These tests run against any pull request that causes an Openshift deployment of
a pull request environment. The best way to view the results is in the CodeQL
section of the checks:

![Bruno Output](./images/codeql_bruno.png)

These tests also run against the `dev` environment after every merge. If they
fail they will block deployment to `test`.
