@echo off
title MedhaBangla Development Environment

echo Starting MedhaBangla Development Environment...

REM Start Docker containers
echo Starting Docker containers...
docker-compose up -d

REM Wait for backend to be ready
echo Waiting for backend to be ready...
:wait_for_backend
docker-compose exec backend python manage.py migrate >nul 2>&1
if errorlevel 1 (
    timeout /t 5 /nobreak >nul
    goto wait_for_backend
)

REM Create superuser if it doesn't exist
echo Creating superuser if it doesn't exist...
docker-compose exec backend python manage.py createsuperuser --noinput >nul 2>&1

REM Check if frontend dependencies are installed
if not exist "frontend\medhabangla\node_modules" (
    echo Installing frontend dependencies...
    cd frontend\medhabangla
    npm install
    cd ..\..
)

echo.
echo Development environment is ready!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
echo Admin: http://localhost:8000/admin
echo.
pause