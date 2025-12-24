# PWA Testing Guide

## What Was Fixed

1. **Added Manifest Link to index.html** - The manifest.webmanifest file wasn't linked in the HTML
2. **Added PWA Meta Tags** - Added theme-color, apple-mobile-web-app tags
3. **Removed Vite PWA Plugin Conflict** - Disabled auto-generated service worker to use custom one
4. **Added Debug Logging** - Console logs to help identify issues
5. **Install Button in Navbar** - Shows when app is installable, hides when installed

## How to Test PWA Installation

### Step 1: Clear Previous Data
1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage** on the left
4. Check all boxes and click **Clear site data**
5. Close DevTools

### Step 2: Restart Development Server
```bash
cd S.P-by-Bipul-Roy/frontend/medhabangla
npm run dev
```

### Step 3: Check Console Logs
1. Open the app in Chrome: http://localhost:5173
2. Open DevTools Console (F12)
3. Look for these logs:
   - `[App] Initializing PWA features...`
   - `[App] Service Worker API is supported`
   - `[App] Manifest link found: /manifest.webmanifest`
   - `[PWA] Checking installation status...`
   - `[PWA] beforeinstallprompt event fired!` ← **This is key!**

### Step 4: Verify Service Worker
1. In DevTools, go to **Application** tab
2. Click **Service Workers** on the left
3. You should see `sw.js` registered and running
4. Status should be "activated and is running"

### Step 5: Verify Manifest
1. In DevTools **Application** tab
2. Click **Manifest** on the left
3. You should see:
   - Name: "MedhaBangla - Educational Platform"
   - Icons: 192x192 and 512x512
   - Start URL: "/"
   - Display: "standalone"

### Step 6: Look for Install Button
The install button should appear in the Navbar if:
- ✅ Service worker is registered
- ✅ Manifest is valid
- ✅ App is served over HTTPS (or localhost)
- ✅ App is not already installed
- ✅ `beforeinstallprompt` event fired

### Step 7: Install the App
1. Click the **"Install App"** button in the Navbar
2. A browser prompt should appear
3. Click "Install"
4. The button should change to **"App Installed"** badge

## Troubleshooting

### Install Button Not Showing?

**Check Console Logs:**
```
[PWA] beforeinstallprompt event fired!  ← If you see this, button should show
```

**If event doesn't fire, check:**

1. **Browser Support** - Use Chrome, Edge, or Opera (not Firefox/Safari)
2. **HTTPS Required** - localhost is OK, but production needs HTTPS
3. **Already Installed?** - Check if app is already installed
4. **Manifest Issues** - Check DevTools > Application > Manifest for errors
5. **Service Worker Issues** - Check DevTools > Application > Service Workers

### Common Issues:

**Issue: "Manifest link NOT found"**
- Solution: The index.html fix should resolve this
- Verify: Check if `<link rel="manifest" href="/manifest.webmanifest" />` exists in index.html

**Issue: Service worker not registering**
- Solution: Check console for errors
- Verify: DevTools > Application > Service Workers shows sw.js

**Issue: Icons not loading**
- Solution: Run `create-icons.html` to generate proper icons
- Open: `S.P-by-Bipul-Roy/frontend/medhabangla/create-icons.html` in browser
- Save downloaded icons to `public/` folder

**Issue: Already installed but button still shows**
- Solution: Clear browser data and reinstall
- Or: Uninstall app from chrome://apps

## Testing on Mobile

### Android (Chrome):
1. Open app on phone: `http://YOUR_IP:5173`
2. Look for "Add to Home Screen" in Chrome menu
3. Or tap the install button in Navbar

### iOS (Safari):
Note: iOS has limited PWA support
1. Open app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Note: Install button won't show on iOS (Safari limitation)

## Production Deployment

For production, ensure:
1. ✅ HTTPS enabled (required for PWA)
2. ✅ Service worker served with correct MIME type
3. ✅ Icons are proper size (not 96 bytes placeholders)
4. ✅ Manifest accessible at `/manifest.webmanifest`

## Generate Proper Icons

Current icons are placeholders (96 bytes). To create proper icons:

1. Open `create-icons.html` in browser
2. Download generated icons
3. Replace files in `public/` folder:
   - `icon-192.png`
   - `icon-512.png`

Or use a tool like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## Debug Commands

Check if service worker is registered:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => console.log(regs));
```

Check if app is installed:
```javascript
console.log(window.matchMedia('(display-mode: standalone)').matches);
```

Force beforeinstallprompt (for testing):
```javascript
// This won't work if criteria aren't met, but helps debug
window.dispatchEvent(new Event('beforeinstallprompt'));
```

## Expected Behavior

✅ **Desktop (Chrome/Edge):**
- Install button appears in Navbar
- Click to install
- App opens in standalone window
- Button changes to "App Installed" badge

✅ **Mobile (Chrome/Android):**
- Install button appears in Navbar
- Or "Add to Home Screen" in browser menu
- App installs to home screen
- Opens fullscreen without browser UI

✅ **After Installation:**
- Notes work offline
- App loads faster (cached)
- Can be launched from home screen/start menu
- Runs in standalone window

## Next Steps

1. Test the install button with the debug logs
2. Generate proper icons using `create-icons.html`
3. Test offline functionality in Notes page
4. Deploy to production with HTTPS
