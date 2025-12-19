#!/bin/bash

# MedhaBangla Development Startup Script

echo "Starting MedhaBangla Development Environment..."

# Start Docker containers
echo "Starting Docker containers..."
docker-compose up -d

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
until docker-compose exec backend python manage.py migrate >/dev/null 2>&1; do
  sleep 5
done

# Create superuser if it doesn't exist
echo "Creating superuser if it doesn't exist..."
docker-compose exec backend python manage.py createsuperuser --noinput || true

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "frontend/medhabangla/node_modules" ]; then
  echo "Installing frontend dependencies..."
  cd frontend/medhabangla
  npm install
  cd ../..
fi

echo "Development environment is ready!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
echo "Admin: http://localhost:8000/admin"