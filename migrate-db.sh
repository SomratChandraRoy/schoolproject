#!/bin/bash

# MedhaBangla Database Migration Script

echo "Running MedhaBangla Database Migrations..."

# Make sure we're in the project root
cd "$(dirname "$0")"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker first."
  exit 1
fi

# Check if containers are running
if ! docker-compose ps | grep -q "backend.*Up"; then
  echo "❌ Backend container is not running. Starting containers..."
  docker-compose up -d
  echo "Waiting for containers to start..."
  sleep 10
fi

# Run migrations
echo "🔄 Running database migrations..."
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Collect static files
echo "📂 Collecting static files..."
docker-compose exec backend python manage.py collectstatic --noinput

# Create initial data if it doesn't exist
echo "🌱 Creating initial data..."
docker-compose exec backend python populate_data.py

echo "✅ Database migrations completed successfully!"