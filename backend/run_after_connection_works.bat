@echo off
REM Run this script AFTER you fix the security group and connection works
REM This will: test connection, run migrations, create superuser, migrate questions

echo ============================================================
echo AWS RDS Setup - Automated Steps
echo ============================================================
echo.
echo This script will:
echo 1. Test database connection
echo 2. Run Django migrations
echo 3. Create superuser (optional)
echo 4. Migrate questions from JSON files
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo ============================================================
echo Step 1: Testing Database Connection
echo ============================================================
python test_aws_connection.py
if errorlevel 1 (
    echo.
    echo ❌ Connection failed! Please fix the security group first.
    echo See: FIX_SECURITY_GROUP.md or DO_THIS_NOW.md
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Step 2: Running Django Migrations
echo ============================================================
echo.
echo Creating database tables...
python manage.py makemigrations
python manage.py migrate

if errorlevel 1 (
    echo.
    echo ❌ Migrations failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Migrations completed successfully!

echo.
echo ============================================================
echo Step 3: Create Superuser (Optional)
echo ============================================================
echo.
set /p create_superuser="Do you want to create a superuser? (Y/N): "
if /i "%create_superuser%"=="Y" (
    echo.
    echo Creating superuser...
    python manage.py createsuperuser
)

echo.
echo ============================================================
echo Step 4: Migrate Questions from JSON Files
echo ============================================================
echo.
echo This will migrate all questions from A.C.Q folder (Classes 6-12)
echo.
set /p migrate_questions="Do you want to migrate questions now? (Y/N): "
if /i "%migrate_questions%"=="Y" (
    echo.
    echo Migrating questions...
    python manage.py migrate_questions_from_json
    
    if errorlevel 1 (
        echo.
        echo ⚠️  Some questions may have failed to migrate.
        echo Check the output above for details.
    ) else (
        echo.
        echo ✅ Questions migrated successfully!
    )
)

echo.
echo ============================================================
echo Step 5: Verify Setup
echo ============================================================
echo.
echo Testing connection and checking database...
python test_aws_connection.py

echo.
echo ============================================================
echo ✅ Setup Complete!
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
