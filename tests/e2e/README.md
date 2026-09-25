# Playwright E2E Tests

Playwright-based end-to-end tests for CSTAR.

## Environment Configuration

Before running the Playwright tests locally, make sure the `tests/e2e/.env` file is configured with the required environment values.

Set the following variables in your local `.env` file:

E2E_IDIR_USERNAME=$$$
E2E_IDIR_PASSWORD=$$$
E2E_MFA_CODE=$$$
BASE_URL=https://your-environment-url

````

Replace the placeholder values with your local IDIR test credentials, MFA code, and environment URL.

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

Playwright tests can be run directly from VS Code.

1. Start the CSTAR Backend and CSTAR Frontend:
   - Open **Run and Debug** in the Activity Bar.
   - Select **CSTAR**.
   - Start the configuration.

2. Run **CSTAR Playwright** from **Run and Debug**.

You can also run the tests from:

**Terminal → Run Task → Playwright - E2E Tests**

## Running from the Command Line

From the Playwright directory:

```bash
cd /workspaces/tenant-management-system/tests/e2e
npm run test:e2e
````

The `test:e2e` command loads the required environment variables from `.env`.

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

If you are already using the Dev Container terminal, run:

```bash
cd /workspaces/tenant-management-system/tests/e2e
npm run test:e2e
```

If you are running the command from a local Windows PowerShell terminal, you can execute Playwright inside the running Dev Container with:

```bash
docker exec -it devcontainer-devcontainer-1 bash -lc "cd /workspaces/tenant-management-system/tests/e2e && npm run test:e2e"
```

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

For pull requests, the tests run against the corresponding PR environment.

The required credentials are provided through GitHub Repository Secrets. Sensitive credentials are not stored in the repository.

The application environment and URL are configured by the GitHub Actions workflow.
