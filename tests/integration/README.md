# Integration Tests

Bruno-based API integration tests. The intention of these is to test the
integration of:

- The API middleware
- The API route layer
- The API controller layer
- The API service layer
- The API ORM layer
- The database

What is important is the omission of Keycloak/SSO, which is explicitly out of
scope for these tests. A mock JWT-minting service is available for testing
authentication for both happy path and failure scenarios.

## Running in VS Code + Bruno CLI

These tests can be run in VS Code:

- Start the backend and mock JWKS server (`Run and Debug` in Activity Bar >
  `Integration Tests Backend`)
- Run `npm test`

## Running in VS Code + Bruno

These tests can be run in the Bruno Application:

- Start the backend and mock JWKS server (`Run and Debug` in Activity Bar >
  `Integration Tests Backend`)
- Install the Bruno application and open `collection`
- Run the tests using the Bruno application test runner

## Running in GitHub Actions

When these tests run for a pull request, they run against a containerized API
and a new empty database.

These tests also always run after merge, again against the containerized API
image and an empty database. If they fail they will block deployment to `test`.
Q: is there value in running the tests a second time? (A: not now, but we may
change the image that gets deployed).
