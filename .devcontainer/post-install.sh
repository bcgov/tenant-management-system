#!/usr/bin/env bash
set -euxo pipefail

# Optional: normalize this script’s line endings if dos2unix is available
if command -v dos2unix &> /dev/null; then
  dos2unix "$0"
fi

# Root of your repo inside the container
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
