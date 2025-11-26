#!/bin/bash
set -e

echo "Starting backend application..."

# Function to check if database is available
check_db_connection() {
  npx typeorm-ts-node-commonjs query "SELECT 1" -d ./src/ormconfig.ts > /dev/null 2>&1
  return $?
}

# Wait for database to be available (migrations should already be done via Flyway)
MAX_RETRIES=30
RETRY_COUNT=0

until check_db_connection; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "ERROR: Failed to connect to database after $MAX_RETRIES attempts."
    exit 1
  fi
  echo "Waiting for database connection (attempt $RETRY_COUNT/$MAX_RETRIES)..."
  sleep 2
done

echo "Database connection established."

# Verify schema exists (Flyway should have created it)
echo "Verifying schema configuration..."
npx typeorm-ts-node-commonjs query "SET search_path TO \"${POSTGRES_SCHEMA:-users}\", public;" -d ./src/ormconfig.ts

# NOTE: Migrations are handled by Flyway in the migrations container
# TypeORM is configured with empty migrations array - do not run migrations here

echo "Starting application..."
exec npm run start