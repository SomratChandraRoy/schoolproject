@echo off
echo ========================================
echo  Enable Universal Browser Support
echo ========================================
echo.
echo This will update the Navbar to support
echo PWA installation in ALL browsers:
echo.
echo  - Chrome/Edge/Brave: Automatic install
echo  - Firefox/Safari: Manual instructions
echo.
echo ========================================
echo.

set /p CONFIRM="Continue? (Y/N): "

if /i not "%CONFIRM%"=="Y" (
    echo.
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Backing up current Navbar...
cd src\components
if exist "Navbar.tsx" (
    copy /Y "Navbar.tsx" "Navbar.backup.tsx" >nul
    echo [OK] Backup created: Navbar.backup.tsx
) else (
    echo [WARN] Navbar.tsx not found
)

echo.
echo Replacing with universal version...
if exist "NavbarUniversal.tsx" (
    copy /Y "NavbarUniversal.tsx" "Navbar.tsx" >nul
    echo [OK] Navbar.tsx updated with universal support
) else (
    echo [ERROR] NavbarUniversal.tsx not found!
    echo Please make sure you're in the correct directory.
    cd ..\..
    pause
    exit /b 1
)

cd ..\..

echo.
echo ========================================
echo [SUCCESS] Universal browser support enabled!
echo ========================================
echo.
echo What's new:
echo  - Install button shows for ALL browsers
echo  - Chrome/Edge/Brave: One-click install
echo  - Firefox/Safari: Step-by-step guide
echo.
echo Next steps:
echo  1. Restart dev server if running
echo  2. Test in different browsers
echo  3. Click "Install App" button
echo.
echo To revert:
echo  Copy Navbar.backup.tsx back to Navbar.tsx
echo.
echo ========================================
pause
