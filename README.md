[![MIT License](https://img.shields.io/github/license/bcgov/quickstart-openshift.svg)](/LICENSE)
[![Lifecycle](https://img.shields.io/badge/Lifecycle-Experimental-339999)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)
[![Merge](https://github.com/bcgov/tenant-management-system/actions/workflows/merge.yml/badge.svg)](https://github.com/bcgov/tenant-management-system/actions/workflows/merge.yml)
[![Analysis](https://github.com/bcgov/tenant-management-system/actions/workflows/analysis.yml/badge.svg)](https://github.com/bcgov/tenant-management-system/actions/workflows/analysis.yml)
[![Scheduled](https://github.com/bcgov/tenant-management-system/actions/workflows/scheduled.yml/badge.svg)](https://github.com/bcgov/tenant-management-system/actions/workflows/scheduled.yml)

# Connected Services, Team Access & Roles (CSTAR)

The Connected Services, Team Access & Roles (CSTAR) manages tenants who use
multitenanted common components.

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
