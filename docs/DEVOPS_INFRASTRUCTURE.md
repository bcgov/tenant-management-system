# DevOps Infrastructure Documentation

**Tenant Management System (TMS)**

**Last Updated**: November 26, 2025
**Version**: 2.0 (Simplified & Clarified)
**Branch**: deployment-fix

---

## Table of Contents

1. [Quick Start - The Golden Rule](#quick-start---the-golden-rule)
2. [The Three Environments](#the-three-environments)
3. [Deployment Flow](#deployment-flow)
4. [GitHub Actions Workflows](#github-actions-workflows)
5. [Database Strategy](#database-strategy)
6. [Secrets & Configuration](#secrets--configuration)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)
9. [Architecture Overview](#architecture-overview)

---

## Quick Start - The Golden Rule

**Every deployment follows this simple rule:**

```
Your Code → GitHub → Actions → Build → Deploy → Test → Done ✅
```

**The Three Key Steps**:

1. **Code** - Write code on a branch
2. **Push** - Push to GitHub (creates PR or merges to main)
3. **Wait** - Automated pipeline deploys and tests

**That's it.** The rest is automatic.

---

## The Three Environments

### 1️⃣ **DEV** (Pull Request Environments)

**When**: Every pull request automatically gets its own temporary environment

**Database**:

- Fresh PostgreSQL (single instance)
- Data deleted when PR closes
- New password generated each time

**Deployment**:

- Frontend: 1 replica
- Backend: 1 replica
- Total startup time: ~10-15 minutes

**URL Format**: `https://tenant-management-system-pr-{NUMBER}.apps.silver.devops.gov.bc.ca`

**Cleanup**: Automatic (when PR closes)

---

### 2️⃣ **TEST** (Staging Environment)

**When**: Automatically deployed when code is merged to `main` branch

**Database**:

- Crunchy PostgreSQL (3 replicas, High Availability)
- Data **preserved** between deployments
- Same production-quality setup as PROD

**Deployment**:

- Frontend: 2-3 replicas (auto-scaling enabled)
- Backend: 2-3 replicas (auto-scaling enabled)
- Database: 3 replicas
- Total startup time: ~20-25 minutes

**URL Format**: `https://tenant-management-system-test-frontend.apps.silver.devops.gov.bc.ca`

**Cleanup**: Manual (controlled by team)

---

### 3️⃣ **PROD** (Production)

**When**: Manually approved by team lead (after TEST verification)

**Database**:

- Crunchy PostgreSQL (3+ replicas, Full HA with backups)
- Data **permanently stored** with automatic backups
- Disaster recovery tested regularly

**Deployment**:

- Frontend: 2-3 replicas (auto-scaling enabled)
- Backend: 2-3 replicas (auto-scaling enabled)
- Database: 3+ replicas
- Zero-downtime updates
- Total startup time: ~20-25 minutes

**URL Format**: `https://tenant-management-system-prod-frontend.apps.silver.devops.gov.bc.ca`

**Cleanup**: Never (permanent production system)

---

## Deployment Flow

### Simple View: What Happens Step-by-Step

```
1. Developer Creates Pull Request
   ↓
2. GitHub Detects New PR
   ↓
3. Automatically:
   ├─ Builds Docker images (backend, frontend, migrations)
   ├─ Pushes to container registry
   ├─ Deploys to DEV environment
   ├─ Creates fresh PostgreSQL database
   ├─ Runs Flyway migrations
   ├─ Runs automated tests
   ├─ Runs security scans (ZAP, CodeQL)
   └─ Posts results as comment
   ↓
4. Developer Sees Results in PR
   ├─ Tests passed? ✅
   ├─ Security checks OK? ✅
   ├─ Visit live environment: https://app-pr-123.apps...
   └─ Get links to logs and reports
   ↓
5. Developer Reviews & Gets Approval
   ↓
6. Developer Merges PR to main
   ↓
7. GitHub Detects Merge
   ↓
8. Automatically:
   ├─ Builds Docker images with "latest" tag
   ├─ Pushes to container registry
   ├─ **AUTO-DEPLOYS TO TEST**
   ├─ Runs full security scan
   ├─ Runs load tests
   └─ Notifies team in Slack/Teams
   ↓
9. Team Verifies in TEST
   ├─ Check live application
   ├─ Verify database migrations worked
   ├─ Confirm features work as expected
   ├─ Review security scan results
   └─ When satisfied, approve PROD deployment
   ↓
10. Team Approves PROD Deployment
    ↓
11. Automatically:
    ├─ Deploys to PROD
    ├─ Tags Docker images as "prod"
    ├─ Enables monitoring and alerts
    └─ Notifies team deployment complete
    ↓
12. ✅ DONE - Code is in production!
```

---

## GitHub Actions Workflows

### Overview (Simple)

GitHub Actions are automated jobs that run when certain events happen. Think of them as robots that do work automatically:

**When they trigger**:

- You open a pull request → Robots build and deploy
- You merge code to main → Robots build and deploy to TEST
- You approve PROD → Robots deploy to PROD
- Every night → Robots clean up old stuff

### The Main Workflows

| Workflow           | File                 | Trigger                 | Purpose                                      |
| ------------------ | -------------------- | ----------------------- | -------------------------------------------- |
| **PR Open**        | `pr-open.yml`        | PR open/sync/reopen     | Build, deploy to PR env, security scan       |
| **PR Validate**    | `pr-validate.yml`    | PR open/sync            | Validate title format, check merge conflicts |
| **Merge to Main**  | `merge.yml`          | Push to main            | Auto-deploy to TEST, manual gate for PROD    |
| **Dev Branch**     | `dev-branch.yml`     | Push to dev             | Auto-deploy to DEV                           |
| **Analysis**       | `analysis.yml`       | Push to main, PRs       | CodeQL, Trivy, unit tests                    |
| **Scheduled**      | `scheduled.yml`      | Weekly (Saturday)       | Purge stale PRs, generate SchemaSpy docs     |
| **Cleanup Images** | `cleanup-images.yml` | Daily (2 AM UTC)        | Remove old container images                  |
| **PR Close**       | `pr-close.yml`       | PR closed/merged        | Cleanup deployments                          |
| **DEMO Route**     | `demo.yml`           | Label with `demo`       | Route long-lived URL to specific PR          |
| **Notifications**  | `notifications.yml`  | PR open, merge complete | MS Teams notifications                       |

**Location**: `.github/workflows/`

### Reusable Workflows (Internal)

These workflows (prefixed with `.`) are called by other workflows:

| Workflow            | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `.build-images.yml` | Build Docker images for backend, frontend, migrations |
| `.deployer.yml`     | Deploy to OpenShift using Helm charts                 |
| `.tests.yml`        | Run E2E and integration tests (Playwright)            |
| `.zap-scan.yml`     | OWASP ZAP security scanning                           |

### Pipeline Flow Diagram

```
Pull Request Branch
    ↓
[PR Open] → [Security Check: Fork Detection]
    ↓
    ├─→ External Fork? → Requires `safe-to-deploy` label
    ↓
[Build Images]
    ├─ Backend (node:18-alpine)
    ├─ Frontend (multi-stage: node:22 → caddy:2.10)
    └─ Migrations (flyway:10)
    ↓
[Deploy to PR Namespace]
    ↓
[Run Tests & Security Scans]
    ├─ E2E Tests (Playwright)
    ├─ Integration Tests
    ├─ ZAP Baseline Scan
    └─ CodeQL Analysis
    ↓
[Post Comment with Links]
    ↓
    ├─→ PR Approved & Merged
    ↓
Main Branch
    ↓
[Build Images with `latest` tag]
    ↓
[Auto-Deploy to TEST]
    ├─ RollingUpdate strategy
    ├─ 2-3 replicas
    └─ Crunchy PostgreSQL
    ↓
[ZAP Full Security Scan]
    ├─ Fail on HIGH alerts
    └─ Generate report
    ↓
[Manual Approval Gate]
    ↓
[Deploy to PROD]
    ├─ RollingUpdate strategy
    ├─ 2-3 replicas
    ├─ Tag images as `prod`
    └─ Zero-downtime deployment
```

---

## Containerization

### Backend Container

**File**: `backend/Dockerfile`

```dockerfile
FROM node:18-alpine

# Installs: python3, make, g++, curl (for build dependencies)
# Configures npm with increased timeouts
# Sets NODE_OPTIONS for memory management
# Installs dependencies with: npm ci --ignore-scripts
# Exposes: Port 4144
# Health Check: HTTP GET /v1/health
```

**Key Characteristics**:

- Alpine-based (minimal attack surface)
- Builds from source (no pre-built binaries)
- Health check endpoint for Kubernetes probes
- Non-root user for security
- Resource limits applied at deployment level

### Frontend Container

**File**: `frontend/Dockerfile` (Multi-stage)

```dockerfile
# Build Stage
FROM node:22.21.1-trixie-slim as builder
# Compiles React/Vite application to static assets

# Runtime Stage
FROM caddy:2.10.2-alpine
# Serves static files via Caddy web server
# Ports: 3000 (frontend), 3001 (health check)
# Non-root user (UID 1001)
```

**Key Characteristics**:

- Multi-stage build reduces final image size
- Caddy reverse proxy handles SSL termination
- Separate health check port (3001)
- Automatic gzip compression
- Security headers configured by Caddy

### Migrations Container

**File**: `migrations/Dockerfile`

```dockerfile
FROM flyway/flyway:10-alpine
# Manages database schema migrations
# Baseline on migrate enabled
```

### Docker Compose (Local Development)

**File**: `docker-compose.yml`

**Services**:

- **database**: PostGIS 16.3.4 (postgis/postgis:16-3.4)

  - Username: postgres
  - Password: default
  - Port: 5432
  - Schema: users (Flyway managed)

- **migrations**: Flyway 10

  - Runs before backend/frontend
  - Manages schema versions

- **backend**: Node.js NestJS

  - Port: 4144
  - Depends on: migrations, database

- **frontend**: Node.js + React/Vite

  - Port: 3000
  - Depends on: backend

- **schemaspy** (optional): Database documentation
- **caddy** (optional): Reverse proxy

**Network**: Named volume `tms-net`
**Persistence**: `postgres_data` volume

### Dev Container

**File**: `.devcontainer/docker-compose.yaml`

- PostgreSQL 15.12-bookworm
- Socat tunnel for IDE port forwarding
- Same network configuration as main docker-compose

---

## Kubernetes & OpenShift Deployment

### Helm Charts Overview

#### Application Chart (Main)

**Path**: `charts/app/`

**Files**:

- `Chart.yaml` - Metadata (v0.1.0, apiVersion: v2)
- `values.yaml` - Defaults for TEST/PROD
- `values-pr.yaml` - Overrides for PR environments
- `templates/` - Kubernetes manifests

**Registry**: ghcr.io (GitHub Container Registry)
**Cluster**: OpenShift Silver (apps.silver.devops.gov.bc.ca)
**Namespace**: Environment-specific (pr-<number>, dev, test, prod)

#### Database Chart (Crunchy)

**Path**: `charts/crunchy/`

**Files**:

- `Chart.yaml` - Metadata
- `values.yml` - Crunchy PostgreSQL defaults
- `values-pr.yml` - Simple OpenShift PostgreSQL for PRs

**Database Strategy**:

- **PR Deployments**: OpenShift native PostgreSQL (1Gi, no HA)
- **DEV**: OpenShift native PostgreSQL
- **TEST/PROD**: Crunchy PostgreSQL (HA, Patroni failover)

### Backend Deployment Configuration

**Replicas**:

- PR: 1
- DEV: 2
- TEST/PROD: 2-3 (HPA enabled)

**Resources**:

- PR: 256Mi request / 512Mi limit
- TEST/PROD: Autoscaled based on 80% CPU target

**Port**: 4144
**Health Checks**:

- Liveness: HTTP GET `/v1/health` (30s initial, 10s interval)
- Readiness: Service availability check
- Startup: Application initialization

**Connection Pooling**: pgBouncer for database

**SSO Configuration**:

- BC Government LoginProxy API endpoints
- Environment-specific credentials via GitHub secrets

### Frontend Deployment Configuration

**Replicas**:

- PR: 1
- DEV: 2
- TEST/PROD: 2-3 (HPA enabled)

**Resources**:

- PR: 128Mi request / 256Mi limit
- TEST/PROD: Auto-calculated

**Port**: 3000
**Health Checks**: HTTP GET `/health` on port 3001

**Rate Limiting** (TEST/PROD):

- 10 concurrent connections
- 20 requests/sec (HTTP)
- 50 requests/sec (TCP)

**Ingress**: OpenShift Route with HAProxy annotations

### Pod Disruption Budgets (PDB)

Enabled for TEST/PROD deployments:

- Minimum 1 pod available during disruptions
- Ensures high availability during maintenance

### Deployment Strategy

| Environment | Strategy      | Max Surge | Max Unavailable |
| ----------- | ------------- | --------- | --------------- |
| PR          | Recreate      | N/A       | 100%            |
| DEV         | RollingUpdate | 25%       | 0               |
| TEST        | RollingUpdate | 25%       | 0               |
| PROD        | RollingUpdate | 25%       | 0               |

---

## Environments Configuration

### Environment Matrix

| Aspect          | PR                   | DEV                  | TEST                | PROD                |
| --------------- | -------------------- | -------------------- | ------------------- | ------------------- |
| **Branch**      | Any                  | dev                  | main                | main                |
| **Auto-Deploy** | Yes (if approved)    | Yes                  | Yes                 | Manual              |
| **Database**    | OpenShift PG (fresh) | OpenShift PG (fresh) | Crunchy HA (retain) | Crunchy HA (retain) |
| **Replicas**    | 1                    | 2                    | 2-3                 | 2-3                 |
| **HPA**         | No                   | Yes                  | Yes                 | Yes                 |
| **Namespace**   | pr-{number}          | dev                  | test                | prod                |
| **Lifespan**    | Until merged/closed  | Permanent            | Permanent           | Permanent           |
| **Cleanup**     | Automatic (7 days)   | Manual               | Manual              | Manual              |

### Environment Variables

#### Backend (`backend/.env`)

```env
PORT=4144
DATABASE_URL=postgresql://app:password@pgbouncer:6432/postgres
POSTGRES_HOST=database
POSTGRES_USER=app
POSTGRES_PASSWORD=<secret>
POSTGRES_DB=postgres

# BC Government SSO
BCGOV_SSO_API_URL=https://api.loginproxy.gov.bc.ca/api/v1/dev/idir/users
BCGOV_TOKEN_URL=https://loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/token
BCGOV_SSO_API_CLIENT_ID=<secret>
BCGOV_SSO_API_CLIENT_SECRET=<secret>
JWKS_URI=https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/certs

# Application
NODE_ENV=development
LOG_LEVEL=debug
```

#### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:4144/v1
VITE_KEYCLOAK_CLIENT_ID=tenant-management-system-6014
VITE_KEYCLOAK_URL=https://dev.loginproxy.gov.bc.ca/auth
VITE_KEYCLOAK_REALM=standard
VITE_LOG_LEVEL=debug
```

### GitHub Secrets & Variables

**Organization Level**:

- `OC_SERVER` - OpenShift API (https://api.silver.devops.gov.bc.ca:6443)
- `MSTEAMS_WEBHOOK` - MS Teams notification webhook
- `BCGOV_SSO_API_CLIENT_ID` - SSO client ID
- `BCGOV_SSO_API_CLIENT_SECRET` - SSO client secret
- `VITE_KEYCLOAK_CLIENT_ID` - Keycloak client ID

**Environment-Specific** (GitHub Environments: dev, test, prod):

- `OC_NAMESPACE` - OpenShift namespace
- `OC_TOKEN` - Service account token
- Additional environment-specific secrets

### Secrets Management Strategy

1. **GitHub Secrets**: Stored at organization/environment level
2. **OpenShift Secrets**: Created during Helm deployment
3. **Environment Injection**: Via GitHub Actions workflow
4. **Rotation Policy**: (To be defined)

---

## Database & Migrations

### Flyway Schema Management

**Configuration**:

- **Version**: 10 (Alpine-based, stable)
- **Location**: `migrations/sql/`
- **Schema**: `tms` (created by V1.0.0\_\_init.sql)
- **Baseline on Migrate**: Enabled (allows fresh DB creation)
- **Database User**: app (or specified in config)

**Docker Compose Config** (Local Development):

```yaml
FLYWAY_URL: jdbc:postgresql://database:5432/postgres
FLYWAY_DEFAULT_SCHEMA: tms
FLYWAY_BASELINE_ON_MIGRATE: true
FLYWAY_LOCATIONS: filesystem:/flyway/sql
```

**Kubernetes Config** (TEST/PROD via Helm):

```yaml
# Environment-aware connection
PR/DEV:
  FLYWAY_URL: jdbc:postgresql://{release}-postgresql:5432/app

TEST/PROD:
  FLYWAY_URL: jdbc:postgresql://{databaseAlias}-pgbouncer:5432/app # Via pgBouncer!

FLYWAY_DEFAULT_SCHEMA: tms
FLYWAY_BASELINE_ON_MIGRATE: true
FLYWAY_CONNECT_RETRIES: 60 # Increased from 30
FLYWAY_CONNECT_RETRY_DELAY: 10 # Increased from 5 (10 minute total timeout)
```

**Note**: The schema name change from `users` to `tms` matches the backend ORM configuration (`schema: 'tms'` in ormconfig.ts)

### Database Persistence Strategy

| Environment | Strategy                | Rationale                          |
| ----------- | ----------------------- | ---------------------------------- |
| PR          | Fresh DB per deployment | Isolated testing, cleanup on close |
| DEV         | Fresh DB on redeploy    | Testing migrations in dev          |
| TEST        | Retain data             | Pre-production validation          |
| PROD        | Retain data             | Production data integrity          |

**Note**: `preserve_database` flag controls this behavior in deployment values

### Prisma ORM Integration

- **Schema-First**: Flyway manages migrations, Prisma reads schema
- **Command**: `npx prisma db pull` - Sync from database
- **Generation**: `npx prisma generate` - Create Prisma client

### Connection Pooling

**pgBouncer** in TEST/PROD:

- Reduces connection overhead
- Connection string: `pgbouncer:6432`
- Managed by Crunchy PostgreSQL

### Crunchy PostgreSQL (TEST/PROD Only)

**Version**: PostgreSQL 16 with PostGIS 3.3+

**Features**:

- Automated failover via Patroni
- Backup management
- Point-in-time recovery
- Monitoring and alerting
- HA configuration (3-node cluster typical)

---

## Security & Scanning

### Multi-Layer Security Scanning

#### 1. OWASP ZAP (DAST - Dynamic Application Security Testing)

**Configuration File**: `.zap/rules.tsv` (custom ruleset)

**Scan Types**:

- **Baseline**: PR deployments (quick scan, ~5 min)
- **Full**: TEST environment (comprehensive, ~30 min)
- **API**: When API changes detected

**Execution**:

- PR: Baseline via `.zap-scan.yml`
- Merge to main: Full scan via `merge.yml`
- Fail condition: HIGH severity alerts fail deployment to PROD

**Fail-Fast Strategy**: HIGH and CRITICAL alerts block PROD deployment

#### 2. CodeQL (SAST - Static Application Security Testing)

**Scope**: Repository-wide static analysis

**Coverage**:

- Backend: JavaScript/TypeScript analysis
- Frontend: JavaScript/TypeScript analysis
- Detects: Code injection, SQL injection, XSS, auth bypass

**Trigger**:

- All PRs
- Push to main
- Weekly scheduled scan

#### 3. Trivy (Container Scanning)

**Scope**: Container image vulnerability scanning

**Image Layers Scanned**:

- OS packages
- Application dependencies
- Configuration

**Trigger**:

- All builds in `analysis.yml`
- Detects: CVEs, misconfigurations

**Policy**: Advisory only (non-blocking)

#### 4. GitHub Dependabot & Renovate

**Dependabot**: GitHub native dependency updates
**Renovate**: Recommended (extended capabilities)

**Configuration** (`renovate.json`):

- Extends bcgov/renovate-config preset
- Automatic PR creation for updates
- Semantic versioning rules

**Scope**:

- npm dependencies (backend, frontend, migrations)
- GitHub Actions versions
- Docker base image versions

### Security Gates

| Environment | CodeQL | Trivy | ZAP      | Manual Review             |
| ----------- | ------ | ----- | -------- | ------------------------- |
| PR          | Yes    | Yes   | Baseline | No                        |
| TEST        | Yes    | Yes   | Full     | No                        |
| PROD        | Yes    | Yes   | Full     | **Yes (Manual Approval)** |

### Branch Protection Rules

**Default Branch**: main

**Requirements**:

- Require 1 pull request review
- Require status checks (Analysis, PR Results, Validate)
- Require code scanning results (CodeQL, Trivy)
- Require linear history
- Block force pushes and deletions

---

## Container Registry & Image Management

### Registry Configuration

**Primary Registry**: GitHub Container Registry (ghcr.io)

**Image Naming Convention**:

```
ghcr.io/bcgov/tenant-management-system/{component}:{tag}
```

**Components**:

- backend
- frontend
- migrations

### Image Tagging Strategy

| Use Case       | Tag                       | Push Frequency    | Retention  |
| -------------- | ------------------------- | ----------------- | ---------- |
| PR Deployments | `pr-{PR_NUMBER}`          | Per PR build      | 7 days     |
| Dev Branch     | `dev-latest`              | Per dev push      | Unlimited  |
| Main/Test      | `latest`                  | Per main merge    | Until PROD |
| Production     | `prod`, `prod-{YYYYMMDD}` | Per PROD approval | Permanent  |
| Release        | `v{SEMVER}`               | Manual tagging    | Permanent  |

### Image Cleanup Policy

**Daily Cleanup Job** (`cleanup-images.yml`):

- Runs: 2 AM UTC daily
- Removes: Images older than 7 days
- Protected Tags\*\*: `latest`, `dev-latest`, active PR images
- Retention\*\*: 10 recent versions of main/deployment-fix

**Manual Cleanup Script**: `scripts/cleanup-pr-manual.sh <PR_NUMBER>`

**Cleanup Triggers**:

- PR closed/merged: Via `pr-close.yml`
- Scheduled: Weekly purge of releases > 1 week old

### Image Scanning

All images scanned by:

1. **Trivy**: Vulnerability scanning (build time)
2. **GitHub Secret Scanning**: Detects hardcoded secrets
3. **Container Registry**: Scans on push

---

## Deployment Scripts & Automation

### Manual Cleanup Script

**Location**: `scripts/cleanup-pr-manual.sh`

**Usage**:

```bash
./scripts/cleanup-pr-manual.sh <PR_NUMBER>
```

**Actions Performed**:

1. Helm release uninstall (`app-pr-{number}`)
2. OpenShift resource cleanup:
   - Secrets
   - ConfigMaps
   - Persistent Volume Claims (PVCs)
3. Crunchy PostgreSQL cluster deletion
4. Lists remaining resources for manual review

**Example**:

```bash
./scripts/cleanup-pr-manual.sh 42
# Uninstalls: app-pr-42
# Deletes: All pr-42 resources
```

### Automated Cleanup Triggers

1. **PR Close Event** (`pr-close.yml`):

   - Triggered automatically when PR closed/merged
   - Uses bcgov/quickstart-openshift-helpers
   - Helm uninstall + resource cleanup

2. **Scheduled Cleanup** (`scheduled.yml`):

   - Runs: Weekly (Saturdays, 8 AM UTC)
   - Action: Purges releases older than 1 week
   - Also generates SchemaSpy documentation

3. **Image Cleanup** (`cleanup-images.yml`):
   - Runs: Daily (2 AM UTC)
   - Action: Removes unused container images
   - Preserves: Latest 10 versions, active deployments

### Deployment Commands

**Manual Helm Deployment**:

```bash
helm install app-pr-42 ./charts/app \
  -f charts/app/values-pr.yaml \
  -n pr-42 --create-namespace \
  --set imageTag=pr-42 \
  --set postgresPreserve=false
```

**Manual Helm Upgrade**:

```bash
helm upgrade app-pr-42 ./charts/app \
  -f charts/app/values-pr.yaml \
  -n pr-42
```

---

## Infrastructure Features

### High Availability (HA)

#### Horizontal Pod Autoscaling (HPA)

**Configuration**:

- **Enabled**: TEST, PROD, DEV (optional)
- **Min Replicas**: 2
- **Max Replicas**: 3
- **Target CPU**: 80% utilization
- **Scale-down delay**: 5 minutes

**Effect**: Automatic scaling based on demand

#### Pod Disruption Budgets (PDB)

**Configuration**:

- **Minimum Available**: 1 pod
- **Environments**: TEST, PROD
- **Purpose**: Ensures service availability during maintenance

#### Rolling Updates

**Strategy**: RollingUpdate (default)

**Parameters**:

- **Max Surge**: 25% (1 additional pod)
- **Max Unavailable**: 0 (all pods remain available)
- **Result**: Zero-downtime deployments

#### Database HA (Crunchy PostgreSQL)

**High Availability Features**:

- Patroni automated failover
- Streaming replication
- Multiple standby replicas
- Automatic switchover on primary failure
- Backup and recovery management

### Networking & Routing

#### OpenShift Routes

**Configuration**:

- **Edge Termination**: TLS/SSL at route level
- **Load Balancing**: HAProxy round-robin
- **Backend**: Service (internal)

**Example Route**:

```
app-pr-42.apps.silver.devops.gov.bc.ca → Service:3000
```

#### Network Policies

**Ingress**: Allow from Ingress Controller
**Egress**: Allow to Kubernetes DNS, external APIs

**Rate Limiting** (TEST/PROD):

- 10 concurrent connections
- 20 HTTP requests/sec
- 50 TCP requests/sec

#### Service Discovery

- **Service Name**: DNS internally available
- **Port Forwarding**: kubectl port-forward for local access

### Monitoring & Observability

#### Health Checks

**Backend** (`/v1/health`):

- **Liveness Probe**: 30s initial delay, 10s interval, 3s timeout
- **Readiness Probe**: Service availability check
- **Purpose**: Kubernetes automatic restart/scheduling

**Frontend** (`/health`):

- **Port**: 3001 (separate from app port 3000)
- **Purpose**: Traffic routing decisions

#### Metrics & Logging

- **Prometheus**: Collects metrics (optional setup)
- **OpenShift Console**: Pod logs, metrics, events
- **GitHub Actions Logs**: Workflow execution details

#### Debugging Access

**Pod Logs**:

```bash
oc logs -f pod/app-pr-42-xyz --namespace=pr-42
```

**Port Forward**:

```bash
oc port-forward service/app-pr-42 3000:3000 --namespace=pr-42
```

### Resource Management

#### CPU & Memory Limits

**PR Environments**:

- Backend: 256Mi request / 512Mi limit
- Frontend: 128Mi request / 256Mi limit
- Database: 256Mi request / 512Mi limit

**TEST/PROD Environments**:

- Backend: 500m request / 1000m limit (tuned)
- Frontend: 250m request / 500m limit (tuned)
- Database: 2Gi request / 4Gi limit

**Eviction Policy**: Pod killed if exceeds limits

#### Storage

**Database Volume**:

- **PR**: 1Gi (ephemeral)
- **DEV**: 5Gi
- **TEST**: 50Gi
- **PROD**: 100Gi+ (backup retention)

**Persistent Volume Claims**: Retain data across pod restarts

---

## Pull Request Workflow

### Fork Safety Model

**Challenge**: External contributors from forks pose security risk if scripts are executed with secrets

**Solution**: Two-tier approval system

#### Internal PRs (from organization branches)

- **Trigger**: PR open, synchronize, reopen
- **Auto-Action**:
  - Build images
  - Deploy to PR namespace
  - Run all tests
  - Security scans
- **No approval required**: Community members with push access

#### External Fork PRs (from outside organization)

- **Trigger**: PR open from fork
- **Detection**: GitHub Actions workflow checks `github.event.pull_request.head.repo.fork`
- **Requirement**: Needs `safe-to-deploy` label before deployment
- **Label Application**: Maintainer reviews code, applies label
- **Auto-Action**: Same as internal PRs after labeling

**Security Logic**:

```yaml
if: github.event.pull_request.head.repo.fork == true
  && !contains(github.event.pull_request.labels.*.name, 'safe-to-deploy')
then: SKIP deployment
  SKIP resource creation
else: PROCEED with full CI/CD
```

### PR Template

**Location**: `.github/pull_request_template.md`

**Sections**:

1. **Description**: What does this PR do?
2. **Issue Reference**: Closes #123
3. **Type of Change**:
   - Bug fix (fixes existing issue)
   - New feature (adds functionality)
   - Breaking change (API changes)
   - Dependency update
4. **Testing Instructions**: How to verify
5. **Checklist**:
   - Code reviewed
   - Tests pass
   - Documentation updated

### Conventional Commits Validation

**Enforcement**: PR title validation in `pr-validate.yml`

**Format**: `type(scope): description`

**Valid Types**:

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style (formatting)
- `refactor` - Code restructuring
- `test` - Test additions/changes
- `chore` - Build/CI/dependency updates
- `perf` - Performance improvements
- `ci` - CI configuration
- `build` - Build system
- `revert` - Revert previous commit

**Examples**:

```
feat(auth): add JWT token validation
fix(api): handle null response in user service
docs: update deployment guide
chore: upgrade dependencies
```

### PR Deployment Links

**Auto-posted** in PR comments by workflow:

```
## 🚀 Deployment Status

✅ Backend: https://app-pr-42.apps.silver.devops.gov.bc.ca
✅ Frontend: https://app-pr-42.apps.silver.devops.gov.bc.ca
📊 Tests: [Results Link]
🔒 Security: [ZAP Report]
```

### DEMO Route Feature

**Purpose**: Long-lived URL for demo environment

**Usage**:

1. Add label `demo` to PR
2. Workflow triggers `demo.yml`
3. Routes demo.apps.silver.devops.gov.bc.ca to PR environment
4. Persists across PR updates
5. Remove label to revert to standard PR URL

---

## Architecture Diagrams

### Deployment Pipeline Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Workflow                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Developer commits → Push to Fork/Branch                    │
│         ↓                                                     │
│  Create Pull Request                                        │
│         ↓                                                     │
│  ┌─────────────────────────────┐                            │
│  │ Is External Fork?           │                            │
│  └──────────┬──────────────────┘                            │
│             ↓                                                 │
│      ┌──────────────┐                                        │
│   YES│              │NO                                      │
│      ↓              ↓                                         │
│  [Awaiting Label]  [Auto-proceed]                            │
│      ↓              ↓                                         │
│  [Maintainer adds]  [Build Images]                           │
│  [safe-to-deploy]   [Deploy to PR]                           │
│      ↓              ↓                                         │
│  [Build Images]     [Run Tests]                              │
│      ↓              ↓                                         │
│  [Deploy to PR]     [Security Scans]                         │
│      ↓              ↓                                         │
│  [Run Tests]        [Post Comments]                          │
│      ↓              ↓                                         │
│  [Security Scans]   [Await Review]                           │
│      ↓              ↓                                         │
│  [Post Comments]    [Approve & Merge]                        │
│      ↓              ↓                                         │
└──────────┬──────────┴──────────────────────────────────────┘
           ↓

           Main Branch (Merge commit)
           ↓
    ┌──────────────────────────────────────────┐
    │  Build Images → Tag: latest              │
    │  Deploy to TEST (RollingUpdate, 2-3 reps)│
    │  Run Full ZAP Scan                       │
    │  Generate Reports                        │
    └──────────────────────────────────────────┘
           ↓
    ┌──────────────────────────────────────────┐
    │  Manual Approval Required                │
    │  (GitHub Environment: prod)              │
    └──────────────────────────────────────────┘
           ↓
    ┌──────────────────────────────────────────┐
    │  Deploy to PROD                          │
    │  Tag Images: prod, prod-YYYYMMDD        │
    │  Zero-downtime RollingUpdate             │
    │  Notify MS Teams                         │
    └──────────────────────────────────────────┘
```

### Environment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   GitHub Container Registry                      │
│  ghcr.io/bcgov/tenant-management-system/{backend|frontend}     │
└─────────────────────────────────────────────────────────────────┘
                             ↓
            ┌────────────────┼────────────────┐
            ↓                ↓                ↓
         PR ENV           TEST ENV          PROD ENV
         (Temporary)      (Persistent)      (Persistent)
            ↓                ↓                ↓
   ┌──────────────────────────────────────────────────────┐
   │         OpenShift Silver Cluster                      │
   │  (apps.silver.devops.gov.bc.ca)                      │
   │                                                       │
   │  ┌───────────────┐  ┌──────────────┐  ┌────────────┐│
   │  │  Namespace    │  │   Namespace  │  │ Namespace  ││
   │  │   pr-{N}      │  │     test     │  │    prod    ││
   │  │               │  │              │  │            ││
   │  │ ┌────────────┐│  │ ┌──────────┐ │  │┌──────────┐││
   │  │ │ Backend x1 ││  │ │ Backend  │ │  ││ Backend  │││
   │  │ │ Frontend x1││  │ │ x2-3 HPA │ │  ││ x2-3 HPA │││
   │  │ │ Routes (1) ││  │ │ Routes   │ │  ││ Routes   │││
   │  │ └────────────┘│  │ └──────────┘ │  ││ (TLS)    │││
   │  │               │  │              │  ││          ││
   │  │ ┌────────────┐│  │ ┌──────────┐ │  ││ ┌──────┐ ││
   │  │ │   OpenShift│  │ │  Crunchy │ │  │││Crunchy││
   │  │ │ PostgreSQL ││  │ │PostgreSQL│ │  │││ PG HA │││
   │  │ │  (1Gi)     ││  │ │(50Gi,HA) │ │  │││(100Gi)││
   │  │ │ FRESH DB   ││  │ │ RETAIN   │ │  ││└──────┘││
   │  │ └────────────┘│  │ └──────────┘ │  │└────────┘│
   │  └───────────────┘  └──────────────┘  └──────────┘│
   │                                                    │
   │  Legend:                                           │
   │  - HPA: Horizontal Pod Autoscaling (2-3 replicas)│
   │  - PDB: Pod Disruption Budgets (min 1 available) │
   │  - RollingUpdate: Zero-downtime deployments      │
   │  - Crunchy: HA Database with Patroni failover   │
   └──────────────────────────────────────────────────────┘
                             ↓
            ┌────────────────┼────────────────┐
            ↓                ↓                ↓
      PR Cleanup      Scheduled             Daily
      (on close)      Cleanup (weekly)      Image Cleanup
                                            (old images)
```

### Security Scanning Pipeline

```
                    ┌─────────────────────────┐
                    │  Source Code Commit     │
                    └────────────┬────────────┘
                                 ↓
                    ┌─────────────────────────┐
                    │   GitHub Actions        │
                    │   Triggered             │
                    └────────────┬────────────┘
                                 ↓
        ┌────────────────────────┼────────────────────────┐
        ↓                        ↓                        ↓
   ┌─────────┐            ┌──────────┐           ┌─────────┐
   │ CodeQL  │            │  Trivy   │           │   ZAP   │
   │ (SAST)  │            │Container │           │ (DAST)  │
   └────┬────┘            └────┬─────┘           └────┬────┘
        ↓                      ↓                      ↓
   JavaScript/TS         OS + Dependency         Dynamic
   Vulnerability         CVEs, Config             Web App
   Detection             Scan                    Scanning
        ↓                      ↓                      ↓
   CodeQL Results         Trivy Report           ZAP Report
        ↓                      ↓                      ↓
        └────────────────────┬─────────────────────┘
                             ↓
                    ┌─────────────────────┐
                    │   Results Check     │
                    │   (Pass/Fail)       │
                    └────────┬────────────┘
                             ↓
                    For PROD Deployment:
                    - FAIL if CodeQL: HIGH+
                    - FAIL if ZAP: HIGH+
                    - WARN if Trivy: Any
                    (Manual review required)
```

---

## Improvement Opportunities

See [DEVOPS_IMPROVEMENTS.md](./DEVOPS_IMPROVEMENTS.md) for detailed analysis and recommendations.

---

## Quick Reference

### Key Files

| Purpose               | Path                           |
| --------------------- | ------------------------------ |
| Workflows             | `.github/workflows/`           |
| App Chart             | `charts/app/`                  |
| DB Chart              | `charts/crunchy/`              |
| Dockerfile (Backend)  | `backend/Dockerfile`           |
| Dockerfile (Frontend) | `frontend/Dockerfile`          |
| Docker Compose        | `docker-compose.yml`           |
| Cleanup Script        | `scripts/cleanup-pr-manual.sh` |
| ZAP Config            | `.zap/rules.tsv`               |

### Common Commands

```bash
# Deploy specific PR manually
helm install app-pr-42 ./charts/app -f charts/app/values-pr.yaml \
  -n pr-42 --create-namespace --set imageTag=pr-42

# Cleanup specific PR
./scripts/cleanup-pr-manual.sh 42

# View logs
oc logs -f pod/app-pr-42-xyz -n pr-42

# Port forward for debugging
oc port-forward service/app-pr-42 3000:3000 -n pr-42

# Check deployment status
oc rollout status deployment/app-pr-42 -n pr-42
```

### Useful Resources

- **OpenShift Console**: https://console.silver.devops.gov.bc.ca
- **GitHub Actions**: Repository → Actions tab
- **Container Registry**: ghcr.io (Docker pull/push)
- **BC DevOps Docs**: https://developer.gov.bc.ca
- **Helm Docs**: https://helm.sh/docs

---

## Recent Fixes & Updates (November 26, 2025)

### Schema Mismatch Fix (Issue from PR #71)

**Problem**: Commit 9db7200 added `schema: 'tms'` to backend ormconfig but migration file still created `USERS` schema.

**Solution**:

- Updated migration file: `CREATE SCHEMA IF NOT EXISTS tms`
- Updated Flyway configuration: `FLYWAY_DEFAULT_SCHEMA: tms`
- Consistent schema across all environments

### Flyway Configuration Improvements

**Changes**:

1. **Downgraded Flyway from 11 to 10** (stable version, eliminates deprecation warnings)
2. **Increased retry timeouts** for Crunchy cluster initialization:
   - `FLYWAY_CONNECT_RETRIES: 30 → 60`
   - `FLYWAY_CONNECT_RETRY_DELAY: 5 → 10` (total: 150s → 600s)
3. **Environment-aware JDBC URLs**:
   - PR/DEV: `jdbc:postgresql://{release}-postgresql:5432/app`
   - TEST/PROD: `jdbc:postgresql://{databaseAlias}-pgbouncer:5432/app`

### Database Connection Initialization

**New wait-for-db InitContainer**:

- Checks database readiness before migrations start
- PR/DEV: Waits for `{release}-postgresql:5432`
- TEST/PROD: Waits for `{databaseAlias}-pgbouncer:5432`
- 60 attempts × 5 seconds = 5-minute timeout

**Backend Startup Dependency**:

- Changed from `service_started` to `service_completed_successfully`
- Backend now waits for migrations to fully complete before starting

### Environment-Aware Configuration

**Backend Database Host** (POSTGRES_HOST):

```
PR/DEV:  {release}-postgresql (direct)
TEST/PROD: {databaseAlias}-pgbouncer (connection pooling)
```

**Password Sources**:

```
PR/DEV:  Generated from {release}-pr-db-pass secret
TEST/PROD: From Crunchy secret {databaseAlias}-pguser-app
```

**Flyway Connection**:

```
PR/DEV:  Direct to {release}-postgresql
TEST/PROD: Via {databaseAlias}-pgbouncer (connection pooling)
```

### Why These Changes Matter

1. **Schema Consistency**: No more mismatch between Flyway and backend
2. **Stability**: Flyway 10 is production-tested, no deprecation warnings
3. **Reliability**: Increased timeouts handle slow cluster initialization
4. **Performance**: pgBouncer connection pooling reduces overhead in TEST/PROD
5. **Debugging**: Clear separation between PR/DEV (simple) and TEST/PROD (HA) configs

---

## Document Information

- **Created**: November 25, 2025
- **Last Updated**: November 26, 2025
- **Current Branch**: deployment-fix
- **Status**: Updated with production fixes
- **Maintainers**: DevOps/Platform Engineering Team

**Next Steps**:

1. Review this document for accuracy
2. Refer to [DEVOPS_IMPROVEMENTS.md](./DEVOPS_IMPROVEMENTS.md) for recommended improvements
3. Create tickets for high-priority improvements
4. Schedule implementation sprints
