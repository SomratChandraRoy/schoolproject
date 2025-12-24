# PowerShell script to clear cache and restart dev server

Write-Host "Clearing Vite cache and restarting dev server..." -ForegroundColor Cyan
Write-Host ""

# Clear Vite cache
if (Test-Path "node_modules\.vite") {
    Write-Host "Clearing Vite cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "✓ Vite cache cleared!" -ForegroundColor Green
} else {
    Write-Host "No Vite cache to clear" -ForegroundColor Gray
}

# Clear dist folder
if (Test-Path "dist") {
    Write-Host "Clearing dist folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist"
    Write-Host "✓ Dist folder cleared!" -ForegroundColor Green
} else {
    Write-Host "No dist folder to clear" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Starting dev server..." -ForegroundColor Cyan
Write-Host ""

# Start dev server
npm run dev
