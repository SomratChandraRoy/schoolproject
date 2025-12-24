@echo off
echo Clearing Vite cache and restarting dev server...
echo.

REM Clear Vite cache
if exist "node_modules\.vite" (
    echo Clearing Vite cache...
    rmdir /s /q "node_modules\.vite"
    echo Vite cache cleared!
) else (
    echo No Vite cache to clear
)

REM Clear dist folder
if exist "dist" (
    echo Clearing dist folder...
    rmdir /s /q "dist"
    echo Dist folder cleared!
) else (
    echo No dist folder to clear
)

echo.
echo Starting dev server...
echo.
npm run dev
