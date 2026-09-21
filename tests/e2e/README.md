# Playwright E2E Tests

Playwright-based end-to-end tests for CSTAR.

## Environment Configuration

Before running the Playwright tests locally, make sure the .env file is updated with the correct environment and configuration values.Set the following environment variables in your .env file:

E2E_IDIR_USERNAME=$$$
E2E_IDIR_PASSWORD=$$$
E2E_MFA_CODE=$$$
BASE_URL=https://your-environment-url

Replace the placeholder values with your actual IDIR credentials, MFA code, and environment URL.

Note: All sensitive environment variables are stored securely in GitHub Secrets, and the repository's GitHub Actions workflows have access to them when running Playwright tests.Do not commit credentials or other sensitive values to .env. Use the appropriate local configuration or GitHub Actions secrets for sensitive information.

## Running in VS Code

These tests can be run in VS Code:

- Start the CSTAR Backend and CSTAR Frontend (`Run and Debug` in Activity Bar > `CSTAR`)
- Run `CSTAR Playwright` from `Run and Debug`

You can also run the tests from:

**Terminal > Run Task > Playwright - E2E Tests**

## Running from the Command Line

From the Playwright directory:

```bash
npm run test:e2e
```

The test command loads environment variables from `.env`.

## Authentication

Playwright uses a saved authentication state so that tests can reuse the authenticated session instead of logging in for every test.

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

The environment and application URL are configured through `.env` and the GitHub Actions workflow.
