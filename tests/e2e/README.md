# Playwright E2E Tests

Playwright-based end-to-end tests for CSTAR.

## Environment Configuration

Before running the Playwright tests locally, make sure the `tests/e2e/.env` file is configured with the required environment values.

For local runs, start the dedicated E2E Keycloak realm from `tests/e2e`:

```bash
docker compose -f keycloak/docker-compose.yml up -d
```

It listens on port `8082`, separate from the devcontainer Keycloak on port `8081`. The imported `standard` realm contains the `cstar-e2e` client, test user, `TMS.OPERATIONS_ADMIN` role, and `client_roles` token mapper. The local-only test credentials are `cstar-e2e-user` / `e2euser`.

Point the local frontend at this realm in `frontend/.env` (do not commit this local override):

```dotenv
VITE_DISABLE_RUNTIME_CONFIG=true
VITE_KEYCLOAK_URL=http://localhost:8082
VITE_KEYCLOAK_REALM=standard
VITE_KEYCLOAK_CLIENT_ID=cstar-e2e
VITE_KEYCLOAK_LOGOUT_URL=http://localhost:8082/realms/standard/protocol/openid-connect/logout
```

Playwright starts or reuses the local backend and frontend. It derives the
backend issuer, JWKS URI, and audience from `E2E_KEYCLOAK_URL` and
`E2E_KEYCLOAK_REALM`; there is no need to start either app manually for a local
Playwright run. The database must be running and initialized before the tests
start.

Configure `tests/e2e/.env`:

```dotenv
BASE_URL=http://localhost:5173/
E2E_AUTH_MODE=keycloak
E2E_KEYCLOAK_URL=http://localhost:8082
E2E_KEYCLOAK_USERNAME=cstar-e2e-user
E2E_KEYCLOAK_PASSWORD=e2euser
```

These credentials are disposable local-test credentials, not real IDIR credentials. To stop the isolated E2E Keycloak, run `docker compose -f keycloak/docker-compose.yml down` from `tests/e2e`.

### Keycloak URL from the Host or Dev Container

Use the Keycloak address reachable from the machine running the Playwright browser:

| Playwright runs on | Keycloak URL                       |
| ------------------ | ---------------------------------- |
| Windows host       | `http://localhost:8082`            |
| Dev Container      | `http://host.docker.internal:8082` |

Use the same host consistently in `VITE_KEYCLOAK_URL`, `VITE_KEYCLOAK_LOGOUT_URL`, the backend `ISSUER` and `JWKS_URI`, and `E2E_KEYCLOAK_URL`. The Dev Container's `localhost` refers to the container itself, so it cannot reach a Keycloak port published on Windows via `localhost`. Keep the frontend `BASE_URL`, Keycloak redirect URI, and web origin as `http://localhost:5173`; those refer to the browser-facing frontend.

**Important:**

- The `.env` file is for local use only and is excluded from Git through `.gitignore`.
- Do not commit `.env` or any credentials/sensitive values to the repository.
- The actual IDIR credentials used by GitHub Actions are stored securely as GitHub Repository Secrets.
- GitHub Actions injects these secrets into the Playwright workflow at runtime.

## Initial Setup

Playwright dependencies and the Chromium browser are installed automatically by `post-install.sh` when the Dev Container is created.

No additional Playwright installation is normally required.

> **Note:** Do not use `npx playwright install --with-deps chromium` in the Dev Container. The `--with-deps` option attempts to install operating-system dependencies and may trigger a `sudo` password prompt in the current Dev Container setup. The required system dependencies are provided by the Dev Container, so `playwright install chromium` is used by `post-install.sh`.

If Playwright is not available after creating or rebuilding the Dev Container, run the `post-install.sh` setup again or rebuild the Dev Container.

## Running in VS Code

Start the E2E Keycloak realm and ensure the database is available, then run
**CSTAR Playwright** from **Run and Debug**. Playwright starts or reuses the
backend and frontend and waits for the backend health endpoint and frontend
URL before running tests.

You can also run the tests from:

**Terminal → Run Task → Playwright - E2E Tests**

## Running from the Command Line

From the Playwright directory:

```bash
cd /workspaces/tenant-management-system/tests/e2e
npm run test:e2e
```

To choose the authentication mode explicitly, use the mode runner:

```bash
npm run test:e2e:mode -- keycloak
npm run test:e2e:mode -- idir
```

`keycloak` runs against the local E2E realm and local application. `idir` uses
the real IDIR/MFA login and requires `IDIR_BASE_URL` to point to an IDIR-enabled
deployed environment; it will not run against localhost. Set `IDIR_BASE_URL` in
the ignored `tests/e2e/.env` file to keep it separate from the local `BASE_URL`.
The IDIR workflow creates and rejects tenant requests, so use a test
environment. The runner loads credentials from `.env` without displaying them.
Playwright options can be added after the mode, for example
`npm run test:e2e:mode -- keycloak --headed`.

For a one-off IDIR run in PowerShell:

```powershell
$env:IDIR_BASE_URL = 'https://<deployed-test-environment>/'
npm run test:e2e:mode -- idir
```

For a one-off IDIR run in Bash:

```bash
IDIR_BASE_URL=https://<deployed-test-environment>/ npm run test:e2e:mode -- idir
```

The `test:e2e` script uses Node's `--env-file=.env` option to load the required
environment variables. For local runs, Playwright starts or reuses the backend
and frontend, waiting for `http://localhost:4144/v1/health` and `BASE_URL` to
respond before running tests. It runs the setup project first to log in through
local Keycloak, saves `support/user.json`, and then reuses that state for the
E2E tests.

### Run in Headed Mode

To see the browser while the tests are running:

```bash
npm run test:e2e -- --headed
```

## Running inside the Dev Container

The Playwright tests should run inside the Dev Container because the repository is mounted at:

```text
/workspaces/tenant-management-system
```

The Dev Container starts PostgreSQL and applies backend migrations during
`post-install.sh`. Start the dedicated E2E Keycloak realm from `tests/e2e`:

```bash
docker compose -f keycloak/docker-compose.yml up -d
```

Playwright starts or reuses the backend and frontend, and waits for their
readiness URLs. The backend health endpoint is `http://localhost:4144/v1/health`;
the frontend defaults to `http://localhost:5173/`.

If you are already using the Dev Container terminal, run:

```bash
cd /workspaces/tenant-management-system/tests/e2e
npm run test:e2e
```

This runs the full Playwright suite: the `setup` project authenticates first, then all Chromium E2E specs run with the saved state.

If you are running the command from a local Windows PowerShell terminal, you can execute Playwright inside the running Dev Container with:

```bash
docker exec -it -e E2E_KEYCLOAK_URL=http://host.docker.internal:8082 devcontainer-devcontainer-1 bash -lc "cd /workspaces/tenant-management-system/tests/e2e && npm run test:e2e"
```

The npm script uses Node's `--env-file=.env` to load the remaining E2E settings
and credentials. The `docker exec -e` value overrides `E2E_KEYCLOAK_URL` for
this run so Playwright can reach Keycloak published on the Windows host. When
the frontend runs inside the Dev Container, set its Keycloak URL and logout URL
to `host.docker.internal`; Playwright derives the backend issuer and JWKS URL
from `E2E_KEYCLOAK_URL`. Keep `BASE_URL` at `http://localhost:5173` when the
frontend also runs inside the Dev Container.

Chromium is installed automatically by `post-install.sh`, so it does not need to be installed before every test run.

## Authentication

Playwright uses a saved authentication state so that tests can reuse an authenticated session instead of logging in for every test.

If the saved authentication state needs to be refreshed, run the setup project:

```bash
cd /workspaces/tenant-management-system/tests/e2e
node --env-file=.env ./node_modules/@playwright/test/cli.js test --project=setup
```

Then run the E2E tests:

```bash
npm run test:e2e
```

## Test Reports

An HTML report is generated after each test run.

To view the report:

```bash
npx playwright show-report
```

Screenshots, videos, and traces may also be available for failed tests depending on the Playwright configuration.

## Running in GitHub Actions

Playwright tests run against the deployed application environment as part of the GitHub Actions workflow.

For pull requests and deployment test workflows, the tests run against the corresponding deployed environment and use the real IDIR login with MFA.

The workflow sets `E2E_AUTH_MODE=idir` and provides the IDIR username, password, and TOTP secret through GitHub Actions secrets. The setup project generates the one-time code at runtime and saves the authenticated state for the rest of the suite. Sensitive credentials are not stored in the repository.

The application environment and URL are configured by the GitHub Actions workflow.
