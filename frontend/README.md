# Frontend

The Tenant Management System frontend has:

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

The Tenant Management System frontend requires configuration so that it can
authenticate in the Keycloak standard realm. Clients are created in the
[SSO Application](https://bcgov.github.io/sso-requests).

### Required .env variables

Copy the `frontend/.env.sample` file to `frontend/.env`. Its settings are:

| Name                        | Description                                          | Example                                                                              |
| --------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| VITE_API_BASE_URL           | The URL of the backend                               | http://localhost:4144/v1                                                             |
| VITE_DISABLE_RUNTIME_CONFIG | Can disable the runtime config for devcontainer      | true                                                                                 |
| VITE_KEYCLOAK_CLIENT_ID     | The client id in the realm                           | example-client-id                                                                    |
| VITE_KEYCLOAK_LOGOUT_URL    | The logout URL                                       | https://dev.loginproxy.gov.bc.ca.auth/realms/standard/protocol/openid-connect/logout |
| VITE_KEYCLOAK_REALM         | The realm in the keycloak instance                   | standard                                                                             |
| VITE_KEYCLOAK_URL           | This is the authorization URL for the keycloak realm | https://dev.loginproxy.gov.bc.ca/auth                                                |

### Project setup

```sh
npm install
```

> Note: in the devcontainer this is done automatically when the container is
> built

### Compiles and hot-reloads for development

```sh
npm run serve
```

> Note: in VSCode this is done automatically when starting the app from
> "Run and Debug" in the Activity Bar

### Compiles and minifies for production

```sh
npm run build
```

> Note: in VSCode this is done using the task "Frontend - Build"

### Lints and fixes files

```sh
npm run lint
```

> Note: in VSCode this is done using the task "Frontend - Lint"

### Openshift Deployment

#### Create secrets in OpenShift

```sh
oc create secret generic tms-frontend-secrets --from-literal=VITE_KEYCLOAK_URL=https://dev.loginproxy.gov.bc.ca/auth --from-literal=VITE_KEYCLOAK_REALM=standard --from-literal=VITE_KEYCLOAK_CLIENT_ID=my-client-id   --from-literal=VITE_KEYCLOAK_LOGOUT_URL=https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/logout --from-literal=VITE_API_BASE_URL=localhost:4144
```

#### Build and push the Docker image

Create an ImageStream

```sh
oc create imagestream tms-frontend
```

Get the registry info

```sh
oc registry info
```

Get your password, example output (sha256~123456...)

```sh
oc whoami -t
```

Log in to the container registry. Replace REGISTRY_INFO with the earlier obtained registry. Replace YOUR_EMAIL with your email. Replace PASSWORD with the earlier obtained password.

```sh
docker login REGISTRY_INFO -u YOUR_EMAIL -p PASSWORD
```

Build and push the image. Replace REGISTRY_INFO with the earlier obtained registry. Replace NAMESPACE with your OpenShift namespace.

```sh
docker build -t REGISTRY_INFO/NAMESPACE/tms-frontend:latest .
docker push REGISTRY_INFO/NAMESPACE/tms-frontend:latest
```

Tag the image

```sh
oc tag NAMESPACE/tms-frontend:latest tms-frontend:latest
```

#### Deploy to Openshift

Package the Helm chart into a .tgz file

```sh
helm package devops/chart
```

Deploy to Openshift, replace NAMESPACE-LICENSEPLATE and replace mycustomdockerhubusername with your DockerHub username. Replace REGISTRY_INFO with the earlier obtained registry. Replace NAMESPACE with your OpenShift namespace

```sh
helm install tms-frontend ./tms-frontend-0.1.0.tgz --namespace NAMESPACE --set image.repository=REGISTRY_INFO/NAMESPACE/tms-frontend
```

#### Updating the application

Build and push the Docker image, then upgrade the chart.

```sh
helm upgrade --install tms-frontend devops/chart --namespace NAMESPACE --set image.repository=REGISTRY_INFO/NAMESPACE/tms-frontend
```
