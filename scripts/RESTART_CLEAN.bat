@echo off
echo ========================================
echo  COMPLETE CLEAN RESTART
echo ========================================
echo.

REM Kill any running node processes
echo Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Clear Vite cache
if exist "node_modules\.vite" (
    echo Clearing Vite cache...
    rmdir /s /q "node_modules\.vite"
    echo [OK] Vite cache cleared
) else (
    echo [SKIP] No Vite cache found
)

REM Clear dist folder
if exist "dist" (
    echo Clearing dist folder...
    rmdir /s /q "dist"
    echo [OK] Dist folder cleared
) else (
    echo [SKIP] No dist folder found
)

REM Clear package-lock and node_modules for complete clean
echo.
echo Do you want to do a COMPLETE clean (delete node_modules)?
echo This will take longer but fixes most issues.
echo.
set /p COMPLETE="Type YES for complete clean, or press Enter to skip: "

if /i "%COMPLETE%"=="YES" (
    echo.
    echo Performing complete clean...
    
    if exist "node_modules" (
        echo Deleting node_modules... (this may take a minute)
        rmdir /s /q "node_modules"
        echo [OK] node_modules deleted
    )
    
    if exist "package-lock.json" (
        del /f /q "package-lock.json"
        echo [OK] package-lock.json deleted
    )
    
    echo.
    echo Reinstalling dependencies...
    call npm install
    
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed!
        echo Please check the error above and try again.
        pause
        exit /b 1
    )
    
    echo [OK] Dependencies reinstalled
)

echo.
echo ========================================
echo  Starting dev server...
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
