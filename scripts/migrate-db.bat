@echo off
title MedhaBangla Database Migration Script

echo Running MedhaBangla Database Migrations...

REM Make sure we're in the project root
cd /d "%~dp0"

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
  echo ❌ Docker is not running. Please start Docker first.
  pause
  exit /b 1
)

REM Check if containers are running
docker-compose ps | findstr "backend.*Up" >nul 2>&1
if errorlevel 1 (
  echo ❌ Backend container is not running. Starting containers...
  docker-compose up -d
  echo Waiting for containers to start...
  timeout /t 10 /nobreak >nul
)

REM Run migrations
echo 🔄 Running database migrations...
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

REM Collect static files
echo 📂 Collecting static files...
docker-compose exec backend python manage.py collectstatic --noinput

REM Create initial data if it doesn't exist
echo 🌱 Creating initial data...
docker-compose exec backend python populate_data.py

echo ✅ Database migrations completed successfully!
pause