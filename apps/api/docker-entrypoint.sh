#!/bin/sh
set -e

echo "🔄 Waiting for PostgreSQL to be ready..."
# Wait for PostgreSQL to be ready
until cd /app/apps/api && npx prisma db push 2>/dev/null; do
  echo "⏳ PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

echo "🔄 Running database migrations..."
cd /app/apps/api && npx prisma db push --skip-generate

echo "🌱 Seeding database..."
cd /app/apps/api && npx tsx prisma/seed.ts

echo "🚀 Starting API server..."
cd /app && pnpm dev --filter=@networking-groups/api
