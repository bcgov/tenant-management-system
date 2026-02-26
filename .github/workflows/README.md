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
