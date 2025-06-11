#!/bin/bash
set -e

echo "Starting database connection check..."

# Function to check if database is available (simplified)
check_db_connection() {
  npx typeorm-ts-node-commonjs query "SELECT 1" -d ./src/common/db.connection.ts > /dev/null 2>&1
  return $?
}

# Wait for database to be available
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

# Set fixed schema
DB_SCHEMA="tms"
echo "Using database schema: $DB_SCHEMA"

# Just ensure the schema exists
echo "Ensuring schema exists..."
npx typeorm-ts-node-commonjs query "CREATE SCHEMA IF NOT EXISTS \"$DB_SCHEMA\";" -d ./src/common/db.connection.ts

# Run migrations - TypeORM will track which ones have been run
echo "Running migrations..."
npx typeorm-ts-node-commonjs migration:run -d ./src/common/db.connection.ts || echo "Migration issues detected, but continuing startup"

# Start the application regardless of migration outcome
echo "Starting application..."
exec npm run start