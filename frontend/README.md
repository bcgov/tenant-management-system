# Frontend Code

The `/frontend` code provides the application. It has:

- Authentication provided by Keycloak
- Vue.js 3 composition components in a Container ("smart") and Presentation
  ("dumb") pattern
- Container components are either high-level route Containers, or may be
  domain-specific Containers within a route (an example is the non-route group
  management Container that is used within the tenant management route
  Container)
- Styling provided by a Vuetify theme that uses the [BC Gov Design Tokens](https://www.npmjs.com/package/@bcgov/design-tokens)
- Application state provided by Pinia stores
- API calls provided by services

To keep the application simple and testable, it is important that:

- The Presentation components receive data using props - they never call the
  stores or services
- The Presentation components send data by emitting events - they never call the
  stores or services
- The Container components call the stores to fetch or create data - they never
  call the services
- The stores call the services, which make the API calls

## Style

Although the [Vue Style Guide](https://vuejs.org/style-guide/) describes itself
as "outdated", it still contains good best practices that should be followed.
The majority of these are caught by the linter and/or Sonar, but all developers
should be aware of them.

Every Vue component _must_:

- Follow the Style Guide best practices (A, B, C, and D)
- Use the Composition API
- The order of the elements is: `<script>`; `<template>`; `<style>`
- The `<script>` imports are grouped into external libraries and then custom
  components
- The `<script>` imports are alphabetized by directory and filename
- The `<script>` code is then grouped into sections separated by "banner"
  comments:
  - Types & Interfaces
  - Component Interface
  - Store and Composable Setup
  - Component State
  - Watchers and Effects
  - Computed Values
  - Component Methods
  - Component Lifecycle
- The items within the above `<script>` sections are ordered alphabetically
- The items within the `<style>` section are ordered alphabetically

The task `Frontend - Lint` runs `npm run lint` and should be run before code is
committed.

## TypeScript

The frontend entirely uses TypeScript and strict type checking. Unfortunately
this does not come without one significant problem: the Vue lifecycle can
guarantee the non-nullness of variables, but TypeScript is unaware of the Vue
lifecycle.

To make this more concrete, a component could be:

```javascript
<script setup lang="ts">
const item = Item | null

function handleClick() {
  // If this method strictly expects an Item, it won't be happy that it's being
  // given `Item | null`.
  callSomething(item)
}
</script>
<template>
  <MyComponent v-if="item" @click="handleClick" />
<template>
```

In the example above, `MyComponent` is only displayed when `item` is non-null,
so `handleClick` is only ever called when `item` is non-null. The problem is
that TypeScript does not know about this.

The pattern used for components that load data into `Type | null` variables
must:

- Provide null guards around use of the variable within the `<script>`
- Provide null guards around use of the variable within the `<template>`
- Use non-null assertions in the `<template>` when passing the variable to
  sub-components. Sub-component props should (almost?) always be `Type` and not
  `Type | null`, otherwise the null guards get out of hand

## Configuration

To configure the frontend for local development, copy the `frontend/.env.sample`
file to `frontend/.env`.

### Required .env variables

| Name                        | Description                                          | Example                                                                              |
| --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| VITE_API_BASE_URL           | The URL of the backend                               | http://localhost:4144/v1                                                             |
| VITE_DISABLE_RUNTIME_CONFIG | Can disable the runtime config for devcontainer      | true                                                                                 |
| VITE_KEYCLOAK_CLIENT_ID     | The client id in the realm                           | example-client-id                                                                    |
| VITE_KEYCLOAK_LOGOUT_URL    | The logout URL                                       | https://dev.loginproxy.gov.bc.ca.auth/realms/standard/protocol/openid-connect/logout |
| VITE_KEYCLOAK_REALM         | The realm in the keycloak instance                   | standard                                                                             |
| VITE_KEYCLOAK_URL           | This is the authorization URL for the keycloak realm | https://dev.loginproxy.gov.bc.ca/auth                                                |

## Running the Frontend

In the Activity Bar select the `Run and Debug` item, and then from the dropdown
list at the top select `CSTAR Frontend`, or select `CSTAR` to start both the
backend and the frontend. Then click the green `Start Debugging` icon.

In the `Ports` tab of the Panel is a link to the frontend running at
`http://localhost:5173`.

Changes to the code are automatically deployed when the file is saved, so there
is no need to restart the server.

## Frontend Logs

Logs appear in the `Debug Console` tab of the Panel. Use the dropdown list to
select `CSTAR Frontend`. Note that the logs are from the web server, not the
application. Application logs appear in the browser console.

## Running Tasks

Builds and tests are set up as Tasks. Go to `Terminal` > `Run Task...` to run:

- `Frontend: Build`: run the build process. Building is not needed for local
  development, but it is useful to test changes to the build process
- `Frontend: Lint`: run eslint against the code
- `Frontend: Unit Tests`: run the unit tests
- `Frontend: Unit Tests (Coverage)`: run the unit tests with a code coverage
  report. The report appears in `backend/coverage/lcov-report/index.html`

The above tests are all run when a Pull Request is created, so it is a good idea
to run them locally before committing changes.
