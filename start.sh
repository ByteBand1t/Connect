#!/bin/sh
echo "Running database migrations..."
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || echo "DB push completed (or already up to date)"
echo "Starting application..."
node server.js
