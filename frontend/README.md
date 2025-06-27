# Frontend

The Tenant Management System frontend has:

- Authentication provided by Keycloak
- Vue.js 3 composition components in a View ("smart") and Presentation ("dumb")
  pattern
- Styling provided by a Vuetify theme that uses the [BC Gov Design Tokens](https://www.npmjs.com/package/@bcgov/design-tokens)
- Application state provided by Pinia stores
- API calls provided by services

To keep the application simple and testable, it is important that:

- The Presentation components receive data using props - they never call the
  stores or services
- The Presentation components send data by emitting events - they never call the
  stores or services
- The View components call the stores to fetch or create data - they never call
  the services
- The stores call the services, which make the API calls

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

### Compiles and hot-reloads for development

```sh
npm run serve
```

### Compiles and minifies for production

```sh
npm run build
```

### Lints and fixes files

```sh
npm run lint
```

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
