#!/bin/bash
set -ex

REPOSITORY_ROOT=$(pwd)

# Do a clean installation of the backend dependencies.
cd $REPOSITORY_ROOT/backend
rm -rf node_modules
npm ci

# Run the backend database migrations.
# TODO: will need to start the DB before doing this.
#npx typeorm-ts-node-commonjs migration:run -d ./src/common/db.connection.ts

# Do a clean installation of the frontend dependencies.
cd $REPOSITORY_ROOT/frontend
rm -rf node_modules
npm ci
