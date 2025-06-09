#!/bin/bash
set -e

echo "Starting database connection check..."

# Function to check if database is available
check_db_connection() {
  # Use TypeORM to test the connection
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

# Get schema name from environment or use default
DB_SCHEMA="tms"
echo "Using database schema: $DB_SCHEMA"

# Try to create schema
echo "Ensuring schema exists..."
npx typeorm-ts-node-commonjs query "CREATE SCHEMA IF NOT EXISTS \"$DB_SCHEMA\";" -d ./src/common/db.connection.ts || true

# Run migrations
echo "Starting database migrations..."
npx typeorm-ts-node-commonjs migration:run -d ./src/common/db.connection.ts

# Check if migrations were successful
if [ $? -eq 0 ]; then
  echo "Migrations completed successfully."
else
  echo "ERROR: Migrations failed. Check database configuration and permissions."
  
  # Additional diagnostics
  echo "Checking database user and permissions..."
  npx typeorm-ts-node-commonjs query "SELECT current_user, current_database();" -d ./src/common/db.connection.ts || true
  npx typeorm-ts-node-commonjs query "SELECT schema_name FROM information_schema.schemata;" -d ./src/common/db.connection.ts || true
  npx typeorm-ts-node-commonjs query "SELECT * FROM information_schema.role_table_grants WHERE table_schema='public';" -d ./src/common/db.connection.ts || true
  
  exit 1
fi

# List tables to verify migrations worked
echo "Verifying database tables..."
npx typeorm-ts-node-commonjs query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" -d ./src/common/db.connection.ts

echo "Starting application..."
exec npm run start