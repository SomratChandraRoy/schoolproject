@echo off
echo ========================================
echo  Cleaning Up Duplicate Users
echo ========================================
echo.

python manage.py cleanup_duplicate_users

echo.
echo ========================================
echo  Cleanup Complete!
echo ========================================
echo.
pause
