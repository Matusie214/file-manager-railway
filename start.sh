#!/bin/sh
set -e

echo "Starting migration process..."

# Wait for database to be ready
while ! npx prisma db push --accept-data-loss --force-reset 2>/dev/null; do
  echo "Waiting for database to be ready..."
  sleep 2
done

echo "Database is ready, running migrations..."
npx prisma migrate deploy || echo "Migration failed, but continuing..."

echo "Starting the application..."
exec node server.js