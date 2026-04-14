#!/usr/bin/env bash

# Root of the repo inside the container
REPOSITORY_ROOT="$(pwd)"

echo "==> Installing integration test dependencies"
cd "$REPOSITORY_ROOT/tests/integration"
npm ci --ignore-scripts
cd mock-jwks
npm ci --ignore-scripts

echo "==> Installing backend dependencies"
cd "$REPOSITORY_ROOT/backend"
npm ci --ignore-scripts

echo "==> Running database migrations"
npm run migrate

echo "==> Installing frontend dependencies"
cd "$REPOSITORY_ROOT/frontend"
npm ci
