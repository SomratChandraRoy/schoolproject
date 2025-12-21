@echo off
REM MedhaBangla Production Deployment Script for Windows
REM This script automates the production deployment process

echo =========================================
echo MedhaBangla Production Deployment
echo =========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)
echo [OK] Docker is installed

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)
echo [OK] Docker Compose is installed

REM Check if .env files exist
if not exist "backend\.env.production" (
    echo [ERROR] backend\.env.production not found
    echo Please create backend\.env.production with your configuration
    pause
    exit /b 1
)
echo [OK] Backend environment file found

if not exist "frontend\medhabangla\.env.production" (
    echo [ERROR] frontend\medhabangla\.env.production not found
    echo Please create frontend\medhabangla\.env.production with your configuration
    pause
    exit /b 1
)
echo [OK] Frontend environment file found

REM Ask for confirmation
echo.
echo [WARNING] This will deploy MedhaBangla to production.
set /p CONFIRM="Are you sure you want to continue? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Deployment cancelled
    pause
    exit /b 0
)

REM Stop existing containers
echo.
echo [INFO] Stopping existing containers...
docker-compose -f docker-compose.prod.yml down
echo [OK] Existing containers stopped

REM Ask to pull latest changes
echo.
set /p PULL="Do you want to pull latest changes from git? (y/n): "
if /i "%PULL%"=="y" (
    echo [INFO] Pulling latest changes...
    git pull origin main
    echo [OK] Latest changes pulled
)

REM Build and start containers
echo.
echo [INFO] Building and starting containers...
docker-compose -f docker-compose.prod.yml up -d --build

REM Wait for services to be ready
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check if services are running
docker-compose -f docker-compose.prod.yml ps | findstr "Up" >nul
if errorlevel 1 (
    echo [ERROR] Services failed to start
    echo Check logs with: docker-compose -f docker-compose.prod.yml logs
    pause
    exit /b 1
)
echo [OK] Services are running

REM Run migrations
echo.
echo [INFO] Running database migrations...
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate
echo [OK] Migrations completed

REM Collect static files
echo.
echo [INFO] Collecting static files...
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput
echo [OK] Static files collected

REM Check if superuser exists
echo.
set /p SUPERUSER="Do you want to create a superuser? (y/n): "
if /i "%SUPERUSER%"=="y" (
    docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
)

REM Setup SSL (if not already done)
if not exist "certbot\conf\live" (
    echo.
    echo [WARNING] SSL certificates not found
    set /p SSL="Do you want to setup SSL with Let's Encrypt? (y/n): "
    if /i "%SSL%"=="y" (
        set /p DOMAIN="Enter your domain name: "
        set /p EMAIL="Enter your email: "
        
        echo [INFO] Requesting SSL certificate...
        docker-compose -f docker-compose.prod.yml run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --email %EMAIL% --agree-tos --no-eff-email -d %DOMAIN% -d www.%DOMAIN%
        
        if not errorlevel 1 (
            echo [OK] SSL certificate obtained
            echo [INFO] Restarting nginx...
            docker-compose -f docker-compose.prod.yml restart nginx
        ) else (
            echo [ERROR] Failed to obtain SSL certificate
        )
    )
)

REM Show service status
echo.
echo [INFO] Service Status:
docker-compose -f docker-compose.prod.yml ps

REM Show logs
echo.
echo [INFO] Recent logs:
docker-compose -f docker-compose.prod.yml logs --tail=20

echo.
echo =========================================
echo [SUCCESS] Deployment completed!
echo =========================================
echo.
echo Access your application at:
echo   - Frontend: https://your-domain.com
echo   - Admin: https://your-domain.com/admin
echo.
echo Useful commands:
echo   - View logs: docker-compose -f docker-compose.prod.yml logs -f
echo   - Restart services: docker-compose -f docker-compose.prod.yml restart
echo   - Stop services: docker-compose -f docker-compose.prod.yml down
echo   - Update: git pull ^&^& docker-compose -f docker-compose.prod.yml up -d --build
echo.
pause
