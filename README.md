[![MIT License](https://img.shields.io/github/license/bcgov/quickstart-openshift.svg)](/LICENSE)
[![Lifecycle](https://img.shields.io/badge/Lifecycle-Experimental-339999)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)
[![Merge](https://github.com/bcgov/tenant-management-system/actions/workflows/merge.yml/badge.svg)](https://github.com/bcgov/tenant-management-system/actions/workflows/merge.yml)
[![Analysis](https://github.com/bcgov/tenant-management-system/actions/workflows/analysis.yml/badge.svg)](https://github.com/bcgov/tenant-management-system/actions/workflows/analysis.yml)
[![Scheduled](https://github.com/bcgov/tenant-management-system/actions/workflows/scheduled.yml/badge.svg)](https://github.com/bcgov/tenant-management-system/actions/workflows/scheduled.yml)

# Connected Services, Team Access & Roles (CSTAR)

The Connected Services, Team Access & Roles (CSTAR) manages tenants who use
multitenanted common components.

## Pull Request-Based Workflows

This repository is based on the [quickstart-openshift](https://github.com/bcgov/quickstart-openshift) repository that provides a template to rapidly deploy a modern web application stack to the BC Government's OpenShift platform using [GitHub Actions](https://github.com/bcgov/tenant-management-system/actions), incorporating best practices for CI/CD, security, and observability. By hitting the ground running we can save weeks-to-months of development time plus receive regular updates and features.

Includes:

- Pull Request-based pipeline
- Sandboxed Pull Request deployments
- Gated/controlled test and production deployments
- Container publishing (ghcr.io) and importing (OpenShift)
- Security, vulnerability, infrastructure, and container scan tools
- Automatic dependency patching available from [bcgov/renovate-config](https://github.com/bcgov/renovate-config)
- Enforced code reviews and workflow jobs (pass|fail)
- Helm Package Manager
- Prometheus Metrics export from Backend/Frontend
- Resource Tuning with Horizontal Pod Autoscaler
- Affinity and anti-affinity for Scheduling on different worker nodes
- Rolling updates with zero downtime in PROD
- Pod disruption budgets for high availability
- Self-healing through probes/checks (startup, readiness, liveness)
- Point the long-lived DEMO route to PRs by using the `demo` label
- Sample application stack:
  - Database: Crunchy (Postgres), backups
  - Frontend: TypeScript, Vue.js, Caddy Server
  - Backend: TypeScript, Express

# Setup

Initial setup is intended to take an hour or less. This depends greatly on intended complexity, features selected/excluded and outside cooperation.

## Prerequisites

The following are required:

- [ ] BC Government IDIR accounts for anyone submitting requests
- [ ] [GitHub accounts](https://github.com/signup) for all participating team members
- [ ] Membership in the BCGov GitHub organization
  - Join the bcgov organization using [these instructions](https://developer.gov.bc.ca/docs/default/component/bc-developer-guide/use-github-in-bcgov/bc-government-organizations-in-github/#directions-to-sign-up-and-link-your-account-for-bcgov).
- [ ] OpenShift project namespaces:
  - [BCGov signup](https://registry.developer.gov.bc.ca)

## Variables, Secrets, and Environments

Workflows use variables and secrets, where variable values are visible in workflows and logs, while secret values are hidden/redacted.

Many workflow variables and secrets come from GitHub, and it's important to understand how GitHub variables, secrets, and environments work together:

- _Repository variables_: have the same value in dev, test, and prod. For example: OpenShift DNS name
- _Environment-specific variables_: have different values in dev, test, and prod. For example: SSO URLs
- _Repository secrets_: have the same value in dev, test, and prod. For example: SSO client password
- _Environment-specific secrets_: have different values in dev, test, and prod. For example: OpenShift access tokens

### Repository Variables

If a value is the same in all environments and is not a secret, it it stored in a GitHub Repository Variable.

- `Settings` > `Secrets and Variables` > `Actions` then in the `Variables` tab scroll down to `Repository variables`

There is a `New repository variable` button for creating new variables. Each variable has an edit icon for changing the value.

### Repository Variables

If a value is the same in all environments and is not a secret, it it stored in a GitHub Repository Variable.

- `Settings` > `Secrets and Variables` > `Actions` then in the `Secrets` tab scroll down to `Repository secrets`

There is a `New repository secret` button for creating new secrets. Each secret has an edit button for replacing the value - secrets, once set, are not visible and cannot be edited

### Environments

Environments are variables and secrets that belong to specific environments: `DEV`, `TEST`, and `PROD`.

Environments provide a [number of features](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment), including:

- Required reviewers
- Wait timer
- Limit TEST/PROD values to post-merge workflows

### Repository Variables

The repository variables are:

| Actions Workflow Name        | Description                  |
| ---------------------------- | ---------------------------- |
| `vars.BCGOV_TOKEN_URL`       | Common user lookup token URL |
| `vars.LOGIN_PROXY_CLIENT_ID` | Common login proxy client id |
| `vars.MSTEAMS_WEBHOOK`       | Common alert webhook         |
| `vars.OC_SERVER`             | Common server address        |

**`BCGOV_TOKEN_URL`**

The token URL used when calling the SSO API. This needs to be set up in the SSO CSS application.

- Consume: `${{ secrets.BCGOV_TOKEN_URL }}`

Locate the SSO API token URL:

1. Log into the [SSO CSS Application](https://sso-requests.apps.gold.devops.gov.bc.ca)
1. Select `My Dashboard` in the top navigation bar
1. Select `My Teams` in the second navigation bar
1. Select the team for this application
1. In the `Team Detail` switch to the `CSS API Account`
1. Download or copy the API Account information
1. Use the `tokenUrl` value

**`LOGIN_PROXY_CLIENT_ID`**

The client ID for the login proxy server.

- Consume: `${{ vars.LOGIN_PROXY_CLIENT_ID }}`
- Value: client identifier from the SSO CSS application

**`MSTEAMS_WEBHOOK`**

> _currently unused_

- Consume: `${{ vars.MSTEAMS_WEBHOOK }}`
- Value: See MS Teams documentation for [webhooks](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook?tabs=newteams%2Cdotnet) and [message cards](https://learn.microsoft.com/en-us/outlook/actionable-messages/message-card-reference)

![https://learn.microsoft.com/en-us/microsoftteams/platform/assets/images/create-incoming-webhook.gif](https://learn.microsoft.com/en-us/microsoftteams/platform/assets/images/create-incoming-webhook.gif)

**`OC_SERVER`**

OpenShift server address.

- Consume: `${{ vars.OC_SERVER }}`
- Value: `https://api.silver.devops.gov.bc.ca:6443`

### Repository Secrets

The repository secrets are:

| Actions Workflow Name                 | Description                          |
| ------------------------------------- | ------------------------------------ |
| `secrets.BCGOV_SSO_API_CLIENT_ID`     | Common Client ID for user lookup     |
| `secrets.BCGOV_SSO_API_CLIENT_SECRET` | Common Client secret for user lookup |
| `secrets.SONAR_TOKEN_BACKEND`         | Common Sonar token for backend code  |
| `secrets.SONAR_TOKEN_FRONTEND`        | Common Sonar token for frontend code |

**`BCGOV_SSO_API_CLIENT_ID`**

The client ID used to call the SSO API. This needs to be set up in the SSO CSS application.

- Consume: `${{ secrets.BCGOV_SSO_API_CLIENT_ID }}`

Locate the SSO API client ID:

1. Log into the [SSO CSS Application](https://sso-requests.apps.gold.devops.gov.bc.ca)
1. Select `My Dashboard` in the top navigation bar
1. Select `My Teams` in the second navigation bar
1. Select the team for this application
1. In the `Team Detail` switch to the `CSS API Account`
1. Download or copy the API Account information
1. Use the `clientId` value

**`BCGOV_SSO_API_CLIENT_SECRET`**

The client secret used to call the SSO API. This needs to be set up in the SSO CSS application.

- Consume: `${{ secrets.BCGOV_SSO_API_CLIENT_SECRET }}`

Locate the SSO API client secret:

1. Log into the [SSO CSS Application](https://sso-requests.apps.gold.devops.gov.bc.ca)
1. Select `My Dashboard` in the top navigation bar
1. Select `My Teams` in the second navigation bar
1. Select the team for this application
1. In the `Team Detail` switch to the `CSS API Account`
1. Download or copy the API Account information
1. Use the `clientSecret` value

**`SONAR_TOKEN_BACKEND`**

SonarCloud is being used for code quality, and the backend code has its own token.

- Consume: `${{ secrets.SONAR_TOKEN_BACKEND }}`

Unfortunately this token is tied to a user and not the project in SonarCloud.

**`SONAR_TOKEN_FRONTEND`**

SonarCloud is being used for code quality, and the frontend code has its own token.

- Consume: `${{ secrets.SONAR_TOKEN_FRONTEND }}`

Unfortunately this token is tied to a user and not the project in SonarCloud.

### Environment-specific Variables

The environment-specific variables are:

| Actions Workflow Name          | Description                   |
| ------------------------------ | ----------------------------- |
| `vars.BCGOV_SSO_API_URL`       | DEV user lookup API URL IDIR  |
| `vars.BCGOV_SSO_API_URL_BCEID` | DEV user lookup API URL BCeID |
| `vars.LOGIN_PROXY_HOST_NAME`   | DEV login proxy host name     |

**`BCGOV_SSO_API_URL`**

The URL for the SSO API to look up IDIR users.

- Consume: `${{ vars.BCGOV_SSO_API_URL }}`
- Value: `https://api.loginproxy.gov.bc.ca/api/v1/dev/idir/users`

**`BCGOV_SSO_API_URL_BCEID`**

The URL for the SSO API to look up BCeID users.

- Consume: `${{ vars.BCGOV_SSO_API_URL_BCeID }}`
- Value: `https://api.loginproxy.gov.bc.ca/api/v1/dev/bceid/users`

**`LOGIN_PROXY_HOST_NAME`**

The environment-specific host name of the login proxy server.

- Consume: `${{ vars.LOGIN_PROXY_HOST_NAME }}`
- Value: `dev.loginproxy.gov.bc.ca` or `test.loginproxy.gov.bc.ca` or `loginproxy.gov.bc.ca`

### Environment-specific Secrets

The environment-specific secrets are:

| Actions Workflow Name  | Description             |
| ---------------------- | ----------------------- |
| `secrets.OC_NAMESPACE` | OpenShift namespace     |
| `secrets.OC_TOKEN`     | OpenShift service token |

**`OC_NAMESPACE`**

Teams will receive a set of project namespaces, usually DEV (for PRs), TEST and PROD. TOOLS namespaces are not used here. Provided by your OpenShift platform team.

- Consume: `${{ secrets.OC_NAMESPACE }}`
- E.g.: `abc123-dev`

**`OC_TOKEN`**

OpenShift's service account token, different for every namespace. The OpenShift platform team has provisioned a pipeline account.

- Consume: `${{ secrets.OC_TOKEN }}`

Locate an OpenShift pipeline token:

1. Login to your OpenShift cluster [Silver](https://console.apps.silver.devops.gov.bc.ca/)
2. Select your DEV namespace
3. Click Workloads > Secrets (under Workloads for Administrator view)
4. Select `pipeline-token-...` or a similarly privileged token
5. Under Data, copy `token`
6. Paste into the GitHub Secret `OC_TOKEN`

## Updating Dependencies

Dependabot and Mend Renovate can both provide dependency updates using pull requests. Dependabot is simpler to configure, while Renovate is much more configurable and lighter on resources.

### Renovate

A config file (`renovate.json`) is included with this template. It can source config from our [renovate repository](https://github.com/bcgov/renovate-config). Renovate can be [self-hosted](https://github.com/renovatebot/github-action) or run using the GitHub App managed at the organization level. For BC Government the OCIO controls this application, so please opt in with them using a GitHub issue.

To opt-in:

- Visit the [Renovate GitHub App](https://github.com/apps/renovate/)
- Click `Configure` and set up your repository
- Visit [BCDevOps Requests](https://github.com/BCDevOps/devops-requests)
- Select [Issues](https://github.com/BCDevOps/devops-requests/issues)
- Select [New Issue](https://github.com/BCDevOps/devops-requests/issues/new/choose)
- Select [Request for integrating a GitHub App](https://github.com/BCDevOps/devops-requests/issues/new?assignees=MonicaG%2C+oomIRL%2C+SHIHO-I&labels=github-app%2C+pending&projects=&template=github_integration_request.md&title=)
- Create a meaningful title, e.g. `Request to add X repo to Renovate App`
- Fill out the description providing a repository name
- Select "Submit new issue"
- Wait for Renovate to start sending pull requests to your repository

### Dependabot

Dependabot is no longer recommended as an alternative to Renovate for generating security, vulnerability and dependency pull requests. It can still be used to generate warnings under the GitHub Security tab, which is only viewable by repository administrators.

## Repository Configuration

### Pull Request Handling

Squash merging is recommended for simplified history and ease of rollback. Cleaning up merged branches is recommended for your DevOps Specialist's fragile sanity.

> Click Settings > General (selected automatically)

Pull Requests:

- `[uncheck] Allow merge commits`
- `[check] Allow squash merging`
  - `Default to pull request title`
- `[uncheck] Allow rebase merging`
- `[check] Always suggest updating pull request branches`
- `[uncheck] Allow auto-merge`
- `[check] Automatically delete head branches`

### Packages

Packages are available from your repository (link on right). All should have visibility set to public for the workflows to run successfully.

E.g. https://github.com/bcgov/quickstart-openshift/packages

### Branch Protection Rules

This is required to prevent direct pushes and merges to the default branch. These steps must be run after one full pull request pipeline has been run to populate the required status checks.

1. Select `Settings` (gear, top right) > `Rules` > `Rulesets` (under Code and Automation)
2. Click `New ruleset` > `New branch ruleset`
3. Setup Ruleset:
   - Ruleset Name: `main`
   - Enforcement status: `Active`
   - Bypass list:
     - Click `+ Add bypass`
     - Check `[x] Repository admin`
     - Click `Add selected`
   - Target branches:
     - Click `Add target`
     - Select `Add default branch`
   - Branch protections:
     - `[x] Restrict deletions`
     - `[x] Require linear history`
     - `[x] Require a pull request before merging`
       - Additional settings:
         - `Require approvals: 1` (or more!)
         - `[x] Require conversation resolution before merging`
     - `[x] Require status checks to pass`
       - `[x] Require branches to be up to date before merging`
       - Required checks: _These will be populated after a full pull request pipeline run!_
         - Click `+Add checks`
         - This is our default set, yours may differ:
           - `Analysis Results`
           - `PR Results`
           - `Validate Results`
   - `[x] Block force pushes`
   - `[x] Require code scanning results`
     - Click `+ Add tool`
     - This is our default set, yours may differ:
       - `CodeQL`
       - `Trivy`
   - Click `Create`

Note: Required status checks will only be available to select after the relevant workflows have run at least once on a pull request.

#### Status checks example

![](./.github/graphics/branch-protection.png)

#### Required tools and alerts example

![](./.github/graphics/branch-code-results.png)

### Adding Team Members

Don't forget to add your team members!

1. Select Settings (gear, top right) \*> Collaborators and teams (under `Access`)
2. Click `Add people` or `Add teams`
3. Use the search box to find people or teams
4. Choose a role (read, triage, write, maintain, admin)
5. Click Add

# Workflows

These workflows and actions enforce a pull request based flow.

```mermaid
flowchart TD
    A1(PR_Env_1) -->|tests| B
    A2(PR_Env_2) -->|tests| B
    A3(PR_Env_3) -->|tests| B
    Ad@{ shape: text, label: "..." }
    An(PR Env n) -->|tests| B
    B(TEST_Env) -->|tests| C(PROD_Env)

    %% Define styles with good contrast for light/dark modes
    %% PR Environments (using distinct, reasonably bright colors)
    style A1 fill:#ffeadb,stroke:#ff8c42,stroke-width:2px,color:#5c3d1e  %% Light Orange/Orange
    style A2 fill:#dbeaff,stroke:#4285f4,stroke-width:2px,color:#1a3f7a  %% Light Blue/Blue
    style A3 fill:#dfffea,stroke:#34a853,stroke-width:2px,color:#154b24  %% Light Green/Green
    style An fill:#fce8ff,stroke:#a142f4,stroke-width:2px,color:#4d1e7a  %% Light Purple/Purple
    %% TEST Environment
    style B fill:#e6f4ea,stroke:#34a853,stroke-width:3px,color:#154b24  %% Lighter Green/Green
    %% PROD Environment
    style C fill:#fff4d8,stroke:#fbbc05,stroke-width:3px,color:#7a5f01  %% Light Gold/Gold

    %% Link style
    linkStyle default stroke:#757575,stroke-width:1px
```

Here's a more detailed view showing a single pull request.

```mermaid
flowchart TD
    A(Developer)
    B(Pull Request)
    Ba(Build Images,<br/>Deploy Images,<br/>E2E Tests)
    Bb(Unit Tests,<br/>Security Analysis,<br/>Vulnerability Analysis)
    Bc(Validate PR Title,<br/>Provide User Feedback)
    Bd(Code Review)
    C{Verify Results}
    D(Merge)
    E(Deploy Images to TEST)
    F{E2E Tests,<br/>Load Tests,<br/>Analysis}
    G(Deploy Images to PROD)
    H(Tag Images as PROD)

    A --> B
    B --> Ba --> C
    B --> Bb --> C
    B --> Bc --> C
    B --> Bd --> C
    C -- fail --> A
    C -- pass --> D --> E --> F
    F -- fail --> A
    F -- pass --> G --> H

    %% Define styles with good contrast for light/dark modes
    %% Developer & PR Actions (Blue)
    style A fill:#dbeaff,stroke:#4285f4,stroke-width:2px,color:#1a3f7a
    style B fill:#dbeaff,stroke:#4285f4,stroke-width:2px,color:#1a3f7a
    %% PR Checks & Validation (Light Green)
    style Ba fill:#e6f4ea,stroke:#34a853,stroke-width:2px,color:#154b24
    style Bb fill:#e6f4ea,stroke:#34a853,stroke-width:2px,color:#154b24
    style Bc fill:#e6f4ea,stroke:#34a853,stroke-width:2px,color:#154b24
    %% Code Review (Light Gold - requires attention)
    style Bd fill:#fff4d8,stroke:#fbbc05,stroke-width:2px,color:#7a5f01
    %% Decision Points (Purple)
    style C fill:#fce8ff,stroke:#a142f4,stroke-width:2px,color:#4d1e7a
    style F fill:#fce8ff,stroke:#a142f4,stroke-width:2px,color:#4d1e7a
    %% Merge & TEST Deployment (Green)
    style D fill:#dfffea,stroke:#34a853,stroke-width:2px,color:#154b24
    style E fill:#e6f4ea,stroke:#34a853,stroke-width:3px,color:#154b24
    %% PROD Deployment & Tagging (Gold)
    style G fill:#fff4d8,stroke:#fbbc05,stroke-width:3px,color:#7a5f01
    style H fill:#fff4d8,stroke:#fbbc05,stroke-width:3px,color:#7a5f01

    %% Link style
    linkStyle default stroke:#757575,stroke-width:1px
```

## Pull Request

Runs on pull request submission.

- Provides safe, sandboxed deployment environments
- Build action pushes to GitHub Container Registry (ghcr.io)
- Build triggers select new builds vs reusing builds
- Deploy only when changes are made
- Deployment includes curl checks and optional penetration tests
- Run tests (e2e, load, integration) when changes are made
- Other checks and updates as required

![](.github/graphics/pr-open.png)

## Validation

Runs on pull request submission.

- Enforces conventional commits in PR title
- Adds greetings/directions to PR descriptions

![](.github/graphics/pr-validate.png)

## Analysis

Runs on pull request submission or merge to the default branch.

- Unit tests (should include coverage)
- CodeQL/GitHub security reporting (now handled as GitHub default!)
- Trivy password, vulnerability and security scanning

![](.github/graphics/analysis.png)

## Pull Request Closed

Runs on pull request close or merge.

- Cleans up OpenShift objects/artifacts
- Merge retags successful build images as `latest`

![](.github/graphics/pr-close.png)

## Merge

Runs on merge to main branch.

- Code scanning and reporting to GitHub Security overview
- Zero-downtime\* DEV deployment
- Penetration tests on TEST deployment (optional)
- Zero-downtime\* TEST deployment
- Zero-downtime\* PROD deployment
- Labels successful deployment images as PROD

\* excludes database changes

![](.github/graphics/merge.png)

## Scheduled

Runs on scheduled job (cronjob) or workflow dispatch.

- PR environment purge
- Generate SchemaSpy documentation
- Tests (e2e, load, integration) on TEST deployment

![](.github/graphics/scheduled.png)

## DEMO Routing

There is a long-lived custom route available to be assigned to specific Pull Request deployments. Add the label `demo` to that pull request or run the `DEMO Route` workflow.

Typical route: `https://<REPO_NAME>-demo.apps.silver.devops.gov.bc.ca`

#### PR Label

Please note that the label must be manually created using GitHub's web interface.

![](.github/graphics/demo-label.png)

#### Workflow

![](.github/graphics/workflow.png)

# App Stack

Frontend (TypeScript)

[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_frontend&metric=bugs)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_frontend)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_frontend&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_frontend)
[![Duplicated Lines](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_frontend&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_frontend)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_frontend&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_frontend)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_frontend&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_frontend)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_frontend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_frontend)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_frontend&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_frontend)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_frontend&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_frontend)

Backend (TypeScript)

[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_backend&metric=bugs)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_backend)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_backend&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_backend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_backend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_backend)
[![Duplicated Lines](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_backend&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_backend)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_backend&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_backend)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_backend&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_backend)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_backend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_backend)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_backend&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_backend)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=bcgov_tenant-management-system_backend&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=bcgov_tenant-management-system_backend)

## Stack

The stack includes a frontend (Vue.js, Vite, Caddy), backend (Express, Node) and Postgres database. See subfolder for source, including Dockerfiles and OpenShift templates.

Features:

- [TypeScript](https://www.typescriptlang.org/) strong-typing for JavaScript
- [Express](https://expressjs.com/) Nest/Node backend and frontend
- [Crunchy](https://www.crunchydata.com/products/crunchy-postgresql-for-kubernetes) Postgres Database

## Crunchy Database

Crunchy is the default choice for high availability (HA) Postgres databases in BC Government.

### Key Features

- Automatic failover with Patroni
- Scheduled backups
- Monitoring
- Self-healing capabilities
- Horizontal scaling options (Read Replicas)

### Setup Tips

1. **Resource Allocation**: Adjust the resources in [crunchy helm chart values](charts/crunchy/values.yml) based on your application needs, since the **defaults are just minimal**.
2. **Environment Configuration**: Create environment-specific configs from base values.yml as `values-test.yml` and `values-prod.yml`, Make sure there are **at least 3 replicas in PRODUCTION**.
3. **DR Testing**: Disaster Recovery Testing is **`MANDATORY`** before go live.

### Enabling S3 Backups

To enable S3 backups/recovery, provide these parameters to the GitHub Action:

- `s3_access_key`
- `s3_secret_key`
- `s3_bucket`
- `s3_endpoint`

> **Important**: Never reuse the same s3/object store, bucket path across different Crunchy deployments or instances (dev, test, prod)

For advanced configuration, see the [re-usable GitHub Action](https://github.com/bcgov/action-crunchy) that manages PR deployments and helm template upgrades.

### Troubleshooting and Support

If you encounter issues, check out the [Troubleshooting Guide](https://github.com/bcgov/crunchy-postgres/blob/main/Troubleshoot.md) for quick solutions.

Need more help? Join the discussion in the [CrunchyDB Rocket.Chat Channel](https://chat.developer.gov.bc.ca/channel/crunchydb) to get support from the community and experts.

## SchemaSpy

The database documentation is created and deployed to GitHub pages. See [here](https://bcgov.github.io/quickstart-openshift/schemaspy/index.html).

After a full workflow run and merge can been run, please do the following:

1. Select Settings (gear, top right) \*> Pages (under `Code and automation`)
2. Click `Branch` or `Add teams`
3. Select `gh-pages`
4. Click `Save`

![img.png](.github/graphics/schemaspy.png)

# Flyway, Prisma, Migrations

1. [Flyway is used as Database Schema Migration tool](https://www.red-gate.com/products/flyway/community/)
2. [Prisma is used as ORM layer](https://www.prisma.io/)
3. The rationale behind using flyway to have schema first approach and let prisma generate ORM schema from the database, which would avoid pitfalls like lazy loading, cascading, etc. when defining entities in ORM manually.
4. Run flyway in the docker compose to apply latest changes to Postgres database.
5. Run npx prisma db pull from backend folder to sync the prisma schema.
6. Run npx prisma generate to generate the prisma client which will have all the entities populated based on fresh prisma schema.
7. If using VS Code, be aware of [this issue](https://stackoverflow.com/questions/65663292/prisma-schema-not-updating-properly-after-adding-new-fields)

# Resources

This repository is provided by NRIDS Architecture and Forestry Digital Services, courtesy of the Government of British Columbia.

- NRID's [Kickstarter Guide](https://bcgov.github.io/nr-architecture-patterns-library/docs/Agile%20Team%20Kickstarter) (via. Confluence, links may be internal)

# [How Tos](./HOWTO.md)

## Architecture

The architecture diagram provides an overview of the system's components, their interactions, and the deployment structure. It illustrates the relationships between the frontend, backend, database, and other infrastructure elements within the OpenShift environment.

![Architecture](./.diagrams/architecture/arch.drawio.svg)

# Contributing

Please contribute your ideas! [Issues](/../../issues) and [Pull Requests](/../../pulls) are appreciated.
