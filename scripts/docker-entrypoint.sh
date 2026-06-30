#!/bin/sh
set -e

echo "[entrypoint] Running migrations..."
node /app/scripts/migrate.mjs

echo "[entrypoint] Starting Next.js server..."
exec node /app/server.js
