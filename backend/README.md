# Backend Code

The `/backend` code provides the ReST API used by the application. It has:

- Authentication provided by Keycloak
- A route / controller / service / ORM layered design
- ORM provided by TypeORM
- TypeScript with strict type checking

This repository is set up for using a VS Code Dev Container. The two goals are
to have as little setup as possible, and to have all developers working with the
same dependencies and configuration.

## Configuration

To configure the backend for local development:

1. Copy `backend/.env.sample` to `backend/.env`
1. Use values from the dev environment Secret `cstar-dev-backend` to set the
   `.env` parameters `BCGOV_SSO_API_CLIENT_ID`, `BCGOV_SSO_API_CLIENT_SECRET`,
   and `BCGOV_SSO_API_URL_BCEID`

## Database Migrations

Database migrations are automatically run when the dev container is built, so
the least-effort migration strategy is to rebuild the container.

Otherwise, migrations are run with `npm migrate` and `npm migrate:down`.

## Running the Backend

In the Activity Bar select the `Run and Debug` item, and then from the dropdown
list at the top select `CSTAR Backend`, or select `CSTAR` to start both the
backend and the frontend. Then click the green `Start Debugging` icon.

In the `Ports` tab of the Panel is a link to the backend running at
`http://localhost:4144`.

Changes to the code are automatically deployed when the file is saved, so there
is no need to restart the server.

## Backend Logs

Logs appear in the `Debug Console` tab of the Panel. Use the dropdown list to
select `CSTAR Backend`.

## Running Tasks

Builds and tests are set up as Tasks. Go to `Terminal` > `Run Task...` to run:

- `Backend: Build`: run the build process. Building is not needed for local
  development, but it is useful to test changes to the build process
- `Backend: Lint`: run eslint against the code
- `Backend: Unit Tests`: run the unit tests
- `Backend: Unit Tests (Coverage)`: run the unit tests with a code coverage
  report. The report appears in `backend/coverage/lcov-report/index.html`

Integration tests are found in the `tests/integration` directory. See the
README file there for details.

The above tests are all run when a Pull Request is created, so it is a good idea
to run them locally before committing changes.
