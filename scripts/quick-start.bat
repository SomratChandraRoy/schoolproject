@echo off
REM Quick Start Script for MedhaBangla (Windows)
REM This script helps you get the project running quickly

echo =========================================
echo MedhaBangla - Quick Start
echo =========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js is installed

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed!
    echo Please install Python from https://python.org/
    pause
    exit /b 1
)
echo [OK] Python is installed

echo.
echo What would you like to do?
echo 1. Install dependencies (first time setup)
echo 2. Start frontend only
echo 3. Start backend only
echo 4. Start both frontend and backend
echo 5. Reset and reinstall everything
echo 6. Exit
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto install
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto backend
if "%choice%"=="4" goto both
if "%choice%"=="5" goto reset
if "%choice%"=="6" goto end

echo Invalid choice!
pause
exit /b 1

:install
echo.
echo =========================================
echo Installing Dependencies
echo =========================================
echo.

echo [1/4] Installing frontend dependencies...
cd frontend\medhabangla
call npm install
if errorlevel 1 (
    echo [ERROR] Frontend installation failed!
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed

echo.
echo [2/4] Creating frontend .env file...
if not exist ".env" (
    copy .env.example .env
    echo [OK] Created .env file - Please edit it with your API keys
) else (
    echo [OK] .env file already exists
)

cd ..\..

echo.
echo [3/4] Installing backend dependencies...
cd backend
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Backend installation failed!
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed

echo.
echo [4/4] Creating backend .env file...
if not exist ".env" (
    copy .env.example .env
    echo [OK] Created .env file - Please edit it with your API keys
) else (
    echo [OK] .env file already exists
)

echo.
echo [4/4] Running database migrations...
python manage.py migrate
echo [OK] Database migrations complete

cd ..

echo.
echo =========================================
echo Installation Complete!
echo =========================================
echo.
echo Next steps:
echo 1. Edit backend/.env with your API keys
echo 2. Edit frontend/medhabangla/.env with your API keys
echo 3. Run this script again and choose option 4 to start both servers
echo.
pause
goto end

:frontend
echo.
echo =========================================
echo Starting Frontend
echo =========================================
echo.
cd frontend\medhabangla
echo Starting Vite dev server...
echo Frontend will be available at: http://localhost:5173
echo.
call npm run dev
goto end

:backend
echo.
echo =========================================
echo Starting Backend
echo =========================================
echo.
cd backend
call venv\Scripts\activate
echo Starting Django dev server...
echo Backend will be available at: http://localhost:8000
echo Admin panel: http://localhost:8000/admin
echo.
python manage.py runserver
goto end

:both
echo.
echo =========================================
echo Starting Both Frontend and Backend
echo =========================================
echo.
echo Starting backend in new window...
start "MedhaBangla Backend" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"

timeout /t 3 /nobreak >nul

echo Starting frontend in new window...
start "MedhaBangla Frontend" cmd /k "cd frontend\medhabangla && npm run dev"

echo.
echo =========================================
echo Both servers are starting!
echo =========================================
echo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8000
echo Admin: http://localhost:8000/admin
echo.
echo Press any key to close this window...
pause >nul
goto end

:reset
echo.
echo =========================================
echo Reset and Reinstall
echo =========================================
echo.
echo [WARNING] This will delete:
echo - node_modules
echo - venv
echo - package-lock.json
echo - All cached files
echo.
set /p confirm="Are you sure? (y/n): "
if /i not "%confirm%"=="y" goto end

echo.
echo Cleaning frontend...
cd frontend\medhabangla
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json
if exist "dist" rmdir /s /q dist
echo [OK] Frontend cleaned

cd ..\..

echo.
echo Cleaning backend...
cd backend
if exist "venv" rmdir /s /q venv
if exist "db.sqlite3" del db.sqlite3
echo [OK] Backend cleaned

cd ..

echo.
echo Cleanup complete! Run option 1 to reinstall.
pause
goto end

:end
echo.
echo Thank you for using MedhaBangla!
