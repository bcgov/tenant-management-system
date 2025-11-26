#!/bin/bash
set -e

echo "Starting backend application..."

# Debug: Print database connection configuration
echo "=== Database Connection Configuration ==="
echo "POSTGRES_HOST: ${POSTGRES_HOST:-NOT SET}"
echo "POSTGRES_PORT: ${POSTGRES_PORT:-5432}"
echo "POSTGRES_USER: ${POSTGRES_USER:-NOT SET}"
echo "POSTGRES_DATABASE: ${POSTGRES_DATABASE:-NOT SET}"
if [ -n "$POSTGRES_PASSWORD" ]; then
  # Mask the password for security, show first 5 and last 5 chars
  PASSWORD_MASKED=$(echo "$POSTGRES_PASSWORD" | sed 's/^\(.\{5\}\).*/\1***/' | sed 's/\(.*\)\(.\{5\}\)$/\1***\2/')
  echo "POSTGRES_PASSWORD: $PASSWORD_MASKED (length: ${#POSTGRES_PASSWORD})"
else
  echo "POSTGRES_PASSWORD: NOT SET"
fi

# Construct and display connection string (without password)
CONNECTION_STRING="postgresql://${POSTGRES_USER:-postgres}@${POSTGRES_HOST:-localhost}:${POSTGRES_PORT:-5432}/${POSTGRES_DATABASE:-postgres}"
echo "Connection String (no password): $CONNECTION_STRING"
echo "Schema: ${POSTGRES_SCHEMA:-users} or 'tms'"
echo "=== End Configuration ==="
echo ""

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
    echo "Debug Info:"
    echo "  POSTGRES_HOST: ${POSTGRES_HOST:-NOT SET}"
    echo "  POSTGRES_USER: ${POSTGRES_USER:-NOT SET}"
    echo "  POSTGRES_PORT: ${POSTGRES_PORT:-5432}"
    echo "  POSTGRES_DATABASE: ${POSTGRES_DATABASE:-NOT SET}"
    echo "  Password length: ${#POSTGRES_PASSWORD}"
    exit 1
  fi
  echo "Waiting for database connection (attempt $RETRY_COUNT/$MAX_RETRIES)..."
  sleep 2
done

echo "Database connection established."

# Verify schema exists (Flyway should have created it)
echo "Verifying schema configuration..."
npx typeorm-ts-node-commonjs query "SET search_path TO \"${POSTGRES_SCHEMA:-tms}\", public;" -d ./src/ormconfig.ts

# NOTE: Migrations are handled by Flyway in the migrations container
# TypeORM is configured with empty migrations array - do not run migrations here

echo "Starting application..."
exec npm run start