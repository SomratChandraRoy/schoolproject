@echo off
REM AWS RDS PostgreSQL Setup Script for Windows
REM Run this script to set up your Django project with AWS RDS

echo ============================================================
echo AWS RDS PostgreSQL Setup for MedhaBangla Project
echo ============================================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install required packages
echo.
echo Installing required packages...
pip install psycopg2-binary python-dotenv

REM Check if .env file exists
if not exist ".env" (
    echo.
    echo Creating .env file from template...
    copy .env.aws.example .env
    echo.
    echo ⚠️  IMPORTANT: Edit .env file with your AWS RDS credentials!
    echo.
    pause
)

REM Test database connection
echo.
echo Testing database connection...
python test_aws_connection.py
if errorlevel 1 (
    echo.
    echo ❌ Database connection failed!
    echo Please check your .env file and AWS RDS configuration.
    echo.
    pause
    exit /b 1
)

REM Run migrations
echo.
echo Running Django migrations...
python manage.py makemigrations
python manage.py migrate

REM Check if superuser exists
echo.
echo Checking for superuser...
python -c "import django; django.setup(); from django.contrib.auth import get_user_model; User = get_user_model(); print('Superuser exists' if User.objects.filter(is_superuser=True).exists() else 'No superuser')" > temp.txt
findstr /C:"No superuser" temp.txt > nul
if not errorlevel 1 (
    echo.
    echo Creating superuser...
    python manage.py createsuperuser
)
del temp.txt

REM Migrate questions
echo.
echo Do you want to migrate questions from JSON files? (Y/N)
set /p migrate_questions=
if /i "%migrate_questions%"=="Y" (
    echo.
    echo Migrating questions from A.C.Q folder...
    python manage.py migrate_questions_from_json
)

echo.
echo ============================================================
echo ✅ Setup completed successfully!
echo ============================================================
echo.
echo Next steps:
echo 1. Start the server: python manage.py runserver
echo 2. Visit admin panel: http://localhost:8000/admin/
echo 3. Visit superuser page: http://localhost:8000/superuser/
echo 4. Test quiz functionality
echo.
echo ============================================================
pause
