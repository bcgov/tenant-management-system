# Tenant Manager

This is the Tenant Manager frontend. It implements a Vue frontend with Keycloak authentication support. The Tenant Manager application allows users to log in using their standard login credentials. Once logged in, they can create a tenancy, search for users in the system to add to that tenancy, and assign roles within the tenancy.

## Configuration

The Tenant Manager frontend will require some configuration. We will need to configure the application to authenticate using a public client on the Keycloak standard realm. You can get a public client from [this link.](https://bcgov.github.io/sso-requests)

### Required .env variables

| Name                      | Description                       | Example                     |
| ------------------------- | --------------------------------- | --------------------------- |
| VITE_KEYCLOAK_URL             | This is the authorization URL for the keycloak realm | https://dev.loginproxy.gov.bc.ca/auth |
| VITE_KEYCLOAK_REALM           | The realm in the keycloak instance | standard    |
| VITE_KEYCLOAK_CLIENT_ID | The client id in the realm   | example-client-id                        |
| VITE_KEYCLOAK_LOGOUT_URL | The logout URL   | https://dev.loginproxy.gov.bc.ca.auth/realms/standard/protocol/openid-connect/logout |
| VITE_BACKEND_API_URL | The URL of the backend   | localhost:4144                        |
| VITE_ALLOWED_HOSTS | The URL of the hosts for the front end   | localhost:4173,localhost5173 |

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
oc create secret generic tms-frontend-secrets --from-literal=VITE_KEYCLOAK_URL=https://dev.loginproxy.gov.bc.ca/auth --from-literal=VITE_KEYCLOAK_REALM=standard --from-literal=VITE_KEYCLOAK_CLIENT_ID=my-client-id   --from-literal=VITE_KEYCLOAK_LOGOUT_URL=https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/logout --from-literal=VITE_ALLOWED_HOSTS=localhost:4173 --from-literal=VITE_BACKEND_API_URL=localhost:4144
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