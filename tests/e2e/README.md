# Playwright E2E Tests

Playwright-based end-to-end tests for CSTAR.

## Isolated local tests (recommended)

Open a terminal in the repository root, either inside the Dev Container or on
your local machine. Inside the Dev Container, Docker in Docker must be available.
On your local machine, Docker Desktop must be running and Node 24/npm must be
installed. Run:

```bash
cd tests/e2e
npm run test:e2e:docker
```

If your terminal is already in `tests/e2e`, run only the npm command. It builds
the test image, starts the separate test stack, runs all Playwright tests, and
stops the containers afterward. No separate `docker compose up`, image rebuild,
database setup, Keycloak startup, or `.env` configuration is needed. The first
run takes longer while Docker downloads images and installs dependencies;
later runs reuse cached build layers where possible.

No host-side npm install or external SSO API credentials are needed for the
Docker runner. IDIR searches are intercepted in the browser by
`support/idir-search.mock.ts` and return the synthetic `E2E User` account
(`e2e.user@example.com`). First name, last name, and email searches use
case-insensitive partial matching; unmatched searches return an empty list.
The UI also searches BCeID in parallel; that request is mocked with an empty list.
Tenant/user/group writes still use the real backend and isolated database.
Backend SSO settings use unused local placeholders so an unmocked search fails
locally instead of contacting the external directory.

The stack uses the separate `cstar-e2e` Compose project and network. It starts:

- A PostgreSQL container with its own `cstar_e2e` database in temporary storage.
- A Keycloak container importing the local `standard` realm and test user.
- A container running backend migrations, the backend, frontend, Chromium, and Playwright.

No ports are published, so the development app, PostgreSQL, and Keycloak can
keep running. The test container uses container-local app ports and the internal
Keycloak address; no changes to development `.env` files are needed. Developer
env files and saved authentication are excluded from the image. Signing keys
are generated for each test run. The local test credentials are
`CHEFS.Testing@gov.bc.ca` / `e2euser` (no leading space in the username).
This is a local Keycloak account with the CHEFS Testing profile, a disposable
local GUID, and operations administrator role. It does not authenticate against
the real IDIR account or reuse its password. The full suite runs locally, including
tenant users, role changes, directory search, and group membership changes.
All tenant and group writes go to the isolated database. Browser search mocks
do not exercise backend SSO token acquisition, directory merging, or deduplication;
those remain covered by the backend service unit tests.

Playwright waits for Keycloak, database initialization, migrations, and both app
readiness URLs. Isolated runs always start their own app processes. The command
returns Playwright's exit code and stops the stack when the tests finish.
PostgreSQL data is discarded when its container stops. Reports and failure
artifacts remain in `tests/e2e/playwright-report` and `tests/e2e/test-results`.

Remove the stopped test containers and network with:

```bash
npm run test:e2e:docker:down
```

### Why both Dockerfile and Docker Compose?

The files work together and have different responsibilities:

- `Dockerfile` builds the test runner image with Node.js, backend and frontend
  dependencies, Playwright, and Chromium. Its entrypoint runs migrations and tests;
  Playwright starts the backend and frontend.
- `docker-compose.yml` runs that image alongside separate PostgreSQL and Keycloak
  containers. It defines their settings, startup dependencies, private network,
  disposable database storage, and report mounts.

Keeping the image build separate from the stack configuration lets PostgreSQL
and Keycloak use their own images and lifecycles. Developers still run just
`npm run test:e2e:docker`; they do not need to manage either file manually.

### Advanced: direct Compose commands

To pass Playwright options with direct Compose commands, start the
dependencies and running the test service:

```bash
docker compose up -d postgres keycloak
docker compose run --build --rm playwright --project=chromium
# Stop the dependencies after the run:
docker compose down
```

These commands run from `tests/e2e`. The database remains available between
`compose run` commands until the dependencies are stopped. Use `compose down`
before a run when a fresh database is needed. Container runs are headless.

## VS Code and the Dev Container

**Run and Debug > CSTAR Playwright** and **Terminal > Run Task > Playwright -
E2E Tests** use the isolated Docker stack. Docker must be running; the Dev
Container provides Docker in Docker. No separate Keycloak startup or frontend
env override is required for this workflow.

The Dev Container also installs host-side Playwright dependencies and Chromium
through `post-install.sh`. Those are only needed for direct runs and viewing
reports, not for the isolated Docker command.

## Direct local runs (uses the configured development database)

For debugging with a headed browser, the existing direct runner is available:

```bash
cd tests/e2e
npm ci --ignore-scripts
npx playwright install chromium
# Copy .env.sample to .env and configure it before running.
docker compose -f keycloak/docker-compose.yml up -d
npm run test:e2e:mode -- keycloak --headed
```

This workflow starts or reuses the development backend and frontend. Initialize
their configured database first. Set the frontend's local env values to:

```dotenv
VITE_DISABLE_RUNTIME_CONFIG=true
VITE_KEYCLOAK_URL=http://localhost:8082
VITE_KEYCLOAK_REALM=standard
VITE_KEYCLOAK_CLIENT_ID=cstar-e2e
VITE_KEYCLOAK_LOGOUT_URL=http://localhost:8082/realms/standard/protocol/openid-connect/logout
```

Use the same Keycloak URL in `tests/e2e/.env` as `E2E_KEYCLOAK_URL`. When running
the browser in the Dev Container against Keycloak published on the Windows
host, use `http://host.docker.internal:8082` consistently instead. Keep
`BASE_URL=http://localhost:5173/` when the frontend runs alongside Playwright.
Playwright derives backend issuer and JWKS settings from the E2E Keycloak URL.
Stop this standalone Keycloak with
`docker compose -f keycloak/docker-compose.yml down`.

Do not commit `.env` files or real credentials. In the Dev Container, use
`playwright install chromium` without `--with-deps`; system dependencies are
already installed by the Dev Container image.

## IDIR and GitHub Actions

IDIR runs require a deployed test environment and real IDIR/MFA credentials.
Set `IDIR_BASE_URL`, `E2E_IDIR_USERNAME`, `E2E_IDIR_PASSWORD`, and `E2E_MFA_CODE`
in the ignored `tests/e2e/.env`, then run:

```bash
npm run test:e2e:mode -- idir
```

IDIR mode rejects localhost. These tests create and modify tenant data, so use
a test environment. GitHub Actions runs against the deployed environment with
`E2E_AUTH_MODE=idir` and credentials injected from repository secrets.

The same tests run with local Keycloak and deployed IDIR login. Direct CI/CD
runs (`CI=true`) use real IDIR and BCeID directory searches through the deployed
backend; no browser search mocks are installed. The deployed backend must have
working SSO API credentials and directory access. Search failures fail the tests;
there is no fallback to synthetic results.

CI/CD searches for the existing directory test account `Nimya John`
(`nimya.1.john@gov.bc.ca`). No workflow changes are required: GitHub Actions
already sets `CI=true`. To use another account, pass these environment
variables to the Playwright process together: `E2E_SSO_TEST_FIRST_NAME`,
`E2E_SSO_TEST_LAST_NAME`, `E2E_SSO_TEST_EMAIL`, and
`E2E_SSO_TEST_DISPLAY_NAME`. Choose an IDIR account other than the login account,
because the tests add and remove it from their test tenant and group.

Non-CI runs use synthetic search results. Isolated Docker runs
(`E2E_ISOLATED=true`) always use synthetic results, even if launched from CI.
Local isolated runs do not connect to the email service. Authentication is
separate from directory search and still uses the selected login mode.

## Authentication, shared data, and reports

The setup project logs in and saves `support/user.json`; the Chromium project
depends on setup and reuses that state. Container authentication stays inside
the test container. Keep `workers: 1` and `fullyParallel: false`: home and
role/group tests share the approved tenant recorded in
`test-results/shared-tenant.json`, which Playwright clears at the next run.
The rejection test creates its own request.

View the HTML report from `tests/e2e` with installed Playwright dependencies:

```bash
npx playwright show-report
```

Failed tests retain screenshots, videos, and traces in `test-results`.
