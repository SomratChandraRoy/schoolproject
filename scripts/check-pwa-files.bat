@echo off
echo ========================================
echo  PWA Files Check
echo ========================================
echo.

set ALL_OK=1

echo Checking required files...
echo.

REM Check manifest
if exist "public\manifest.webmanifest" (
    echo [OK] manifest.webmanifest exists
) else (
    echo [ERROR] manifest.webmanifest NOT FOUND
    set ALL_OK=0
)

REM Check service worker
if exist "public\sw.js" (
    echo [OK] sw.js exists
) else (
    echo [ERROR] sw.js NOT FOUND
    set ALL_OK=0
)

REM Check icons
if exist "public\icon-192.png" (
    echo [OK] icon-192.png exists
    for %%A in ("public\icon-192.png") do (
        if %%~zA LSS 1000 (
            echo [WARN] icon-192.png is very small (%%~zA bytes^)
            echo [WARN] Generate proper icons with create-icons.html
        )
    )
) else (
    echo [ERROR] icon-192.png NOT FOUND
    set ALL_OK=0
)

if exist "public\icon-512.png" (
    echo [OK] icon-512.png exists
    for %%A in ("public\icon-512.png") do (
        if %%~zA LSS 1000 (
            echo [WARN] icon-512.png is very small (%%~zA bytes^)
            echo [WARN] Generate proper icons with create-icons.html
        )
    )
) else (
    echo [ERROR] icon-512.png NOT FOUND
    set ALL_OK=0
)

REM Check index.html for manifest link
findstr /C:"manifest.webmanifest" "public\index.html" >nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] index.html has manifest link
) else (
    echo [ERROR] index.html missing manifest link
    set ALL_OK=0
)

echo.
echo ========================================

if %ALL_OK% EQU 1 (
    echo [SUCCESS] All PWA files are present!
    echo.
    echo Next steps:
    echo 1. Make sure dev server is running: npm run dev
    echo 2. Open in Chrome/Edge: http://localhost:5173
    echo 3. Open DevTools: F12
    echo 4. Check console for: [PWA] beforeinstallprompt event fired!
) else (
    echo [FAILED] Some files are missing!
    echo.
    echo Please fix the errors above.
    echo.
    echo To generate icons:
    echo 1. Open create-icons.html in browser
    echo 2. Download the generated icons
    echo 3. Save them to public\ folder
)

echo ========================================
echo.
pause
