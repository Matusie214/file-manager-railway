#!/bin/sh
set -e

echo "=== Starting migration process ==="

echo "Pushing database schema..."
npx prisma db push --accept-data-loss --skip-generate || echo "DB push failed, but continuing..."

echo "=== Starting the application ==="
exec node server.js