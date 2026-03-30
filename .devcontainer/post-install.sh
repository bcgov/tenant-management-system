#!/usr/bin/env bash

# Root of the repo inside the container
REPOSITORY_ROOT="$(pwd)"

echo "==> Starting docker daemon"
sudo dockerd > /tmp/dockerd.log 2>&1 &

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
