# Fix: React useState Error

## The Error
```
TypeError: Cannot read properties of null (reading 'useState')
```

## What Happened
When I removed the Vite PWA plugin from the config, it left some cached build artifacts that are causing React to not load properly.

## Quick Fix (Choose One)

### Option 1: Use the Batch Script (Easiest)
```bash
cd S.P-by-Bipul-Roy/frontend/medhabangla
restart-dev.bat
```

This will:
1. Clear Vite cache
2. Clear dist folder
3. Restart dev server

### Option 2: Manual Steps
```bash
cd S.P-by-Bipul-Roy/frontend/medhabangla

# Clear caches
rmdir /s /q node_modules\.vite
rmdir /s /q dist

# Restart dev server
npm run dev
```

### Option 3: Full Clean (If above doesn't work)
```bash
cd S.P-by-Bipul-Roy/frontend/medhabangla

# Stop any running dev server (Ctrl+C)

# Clear everything
rmdir /s /q node_modules\.vite
rmdir /s /q dist
rmdir /s /q node_modules

# Reinstall dependencies
npm install

# Start dev server
npm run dev
```

## Why This Happened

The Vite PWA plugin was generating its own service worker and manifest. When I removed it from the config to use our custom service worker, Vite's cache still had references to the old plugin setup, causing module resolution issues.

## What I Did to Fix It

1. ✅ Removed Vite PWA plugin from config
2. ✅ Cleared Vite cache (`.vite` folder)
3. ✅ Cleared dist folder
4. ✅ Created restart script for easy recovery

## After Restarting

Once the dev server restarts successfully:

1. Open http://localhost:5173
2. Open DevTools Console (F12)
3. Look for these logs:
   ```
   [App] Initializing PWA features...
   [PWA] beforeinstallprompt event fired!
   ```
4. Install button should appear in Navbar

## If Error Persists

Try these in order:

1. **Check browser console** - Any other errors?
2. **Try incognito mode** - Rules out browser extensions
3. **Clear browser cache** - F12 → Application → Clear storage
4. **Check React version** - Run: `npm list react`
5. **Reinstall dependencies** - See Option 3 above

## Verify Fix Worked

After restarting, you should see:
- ✅ No errors in console
- ✅ App loads normally
- ✅ Dark mode toggle works
- ✅ PWA logs appear
- ✅ Install button shows (if installable)

## Prevention

To avoid this in the future:
- Clear Vite cache when changing Vite config
- Use `restart-dev.bat` when things break
- Check console for build errors

## Still Having Issues?

If the error persists after trying all options:

1. Check if any dev server is still running (kill it)
2. Restart your code editor
3. Check if port 5173 is in use
4. Try a different port: `npm run dev -- --port 5174`

## Files I Created

- `restart-dev.bat` - Quick restart script
- `FIX_REACT_ERROR.md` - This guide

## Next Steps

Once the error is fixed:
1. Test the PWA install button
2. Follow `QUICK_START_PWA.md` for testing
3. Use `pwa-test.html` to verify everything works
