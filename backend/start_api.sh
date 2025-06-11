#!/bin/bash
set -e

echo "Starting database connection check..."
# ... existing connection check code ...

echo "Database connection established."

# Set fixed schema
DB_SCHEMA="tms"
echo "Using database schema: $DB_SCHEMA"

# Create and configure schema - this will work because your app has SUPERUSER privileges
echo "Setting up schema..."
npx typeorm-ts-node-commonjs query "CREATE SCHEMA IF NOT EXISTS \"$DB_SCHEMA\";" -d ./src/common/db.connection.ts
npx typeorm-ts-node-commonjs query "GRANT ALL ON SCHEMA \"$DB_SCHEMA\" TO PUBLIC;" -d ./src/common/db.connection.ts
npx typeorm-ts-node-commonjs query "ALTER DEFAULT PRIVILEGES IN SCHEMA \"$DB_SCHEMA\" GRANT ALL ON TABLES TO PUBLIC;" -d ./src/common/db.connection.ts

# Set search path
echo "Setting search path..."
npx typeorm-ts-node-commonjs query "SET search_path TO \"$DB_SCHEMA\", public;" -d ./src/common/db.connection.ts

# Run migrations
echo "Starting database migrations..."
npx typeorm-ts-node-commonjs migration:run -d ./src/common/db.connection.ts

# Check if migrations were successful
if [ $? -eq 0 ]; then
  echo "Migrations completed successfully."
else
  echo "ERROR: Migrations failed."
  # ... diagnostic code ...
  exit 1
fi

# List tables in your schema, not public
echo "Verifying database tables..."
npx typeorm-ts-node-commonjs query "SELECT table_name FROM information_schema.tables WHERE table_schema = '$DB_SCHEMA';" -d ./src/common/db.connection.ts

echo "Starting application..."
exec npm run start