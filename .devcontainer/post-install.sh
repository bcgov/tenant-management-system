#!/usr/bin/env bash
#set -euxo pipefail

# Root of the repo inside the container
REPOSITORY_ROOT="$(pwd)"

echo "==> Installing backend dependencies"
cd "$REPOSITORY_ROOT/backend"
rm -rf node_modules
npm ci

echo "==> Running database migrations"
npx typeorm-ts-node-commonjs migration:run -d ./src/common/db.connection.ts

echo "==> Installing frontend dependencies"
cd "$REPOSITORY_ROOT/frontend"
rm -rf node_modules
npm ci
