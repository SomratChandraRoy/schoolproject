# Fix: beforeinstallprompt Event Not Firing

## The Issue

You're using Chrome/Edge (✅) but the `beforeinstallprompt` event isn't firing, which means the install button won't show.

---

## Quick Fixes (Try These in Order)

### Fix 1: Check if Already Installed

The event won't fire if the app is already installed.

**Check:**
1. Go to `chrome://apps` (Chrome) or `edge://apps` (Edge)
2. Look for "MedhaBangla"
3. If you see it, right-click → "Remove from Chrome/Edge"
4. Refresh your app: `http://localhost:5173`

---

### Fix 2: Clear Browser Data

Old cached data can prevent the event from firing.

**Steps:**
1. Press `F12` to open DevTools
2. Go to **Application** tab
3. Click **Clear storage** (left sidebar)
4. Check all boxes
5. Click **Clear site data**
6. Close DevTools
7. Refresh page: `Ctrl + Shift + R`

---

### Fix 3: Check Service Worker

**In debug page, is "Service Worker registered" checked?**

If NO:
1. Open DevTools (F12)
2. Go to **Application** → **Service Workers**
3. Click "Unregister" if any exist
4. Refresh page
5. Service worker should register automatically

---

### Fix 4: Check Manifest

**In debug page, is "Manifest file exists" checked?**

If NO, the manifest might have errors.

**Check in DevTools:**
1. Press F12
2. Go to **Application** tab
3. Click **Manifest** (left sidebar)
4. Look for errors in red

**Common manifest issues:**
- Missing `start_url`
- Missing `name` or `short_name`
- Invalid `display` value
- Missing or invalid icons

---

### Fix 5: Wait Longer

Sometimes the event takes a few seconds to fire.

**Try:**
1. Open the app
2. Wait 10-15 seconds
3. Check console for the event
4. Interact with the page (click around)

---

### Fix 6: Check Icons

**In debug page, is "Icons available" checked?**

If NO:
1. Open `create-icons.html` in browser
2. Download the 2 generated icons
3. Save them to `public/` folder as:
   - `icon-192.png`
   - `icon-512.png`
4. Refresh your app

---

## Complete Clean Start (Nuclear Option)

If nothing above works, do a complete clean:

```bash
# 1. Close all browser tabs with your app

# 2. Clear browser data (F12 → Application → Clear storage)

# 3. Uninstall app if installed (chrome://apps)

# 4. Stop dev server (Ctrl+C)

# 5. Clear caches
cd S.P-by-Bipul-Roy\frontend\medhabangla
rmdir /s /q node_modules\.vite
rmdir /s /q dist

# 6. Restart dev server
npm run dev

# 7. Open in NEW incognito window
# Chrome: Ctrl+Shift+N
# Then go to: http://localhost:5173

# 8. Wait 10 seconds

# 9. Check console for event
```

---

## Diagnostic Steps

### Step 1: Check Console

Open DevTools (F12) → Console tab

**Look for these logs:**
```
[App] Initializing PWA features...
[App] Service Worker API is supported
[App] Manifest link found: /manifest.webmanifest
[PWA] Checking installation status...
[PWA] beforeinstallprompt event fired!  ← This one!
```

**If you see errors in red, that's the problem!**

---

### Step 2: Check Application Tab

DevTools (F12) → Application tab

**Check these sections:**

1. **Manifest**
   - Should show app name, icons, etc.
   - No errors in red

2. **Service Workers**
   - Should show `sw.js`
   - Status: "activated and is running"

3. **Storage**
   - Should show some cached files

---

### Step 3: Check Network Tab

DevTools (F12) → Network tab → Refresh page

**Look for:**
- `/manifest.webmanifest` - Should be 200 OK
- `/sw.js` - Should be 200 OK
- `/icon-192.png` - Should be 200 OK
- `/icon-512.png` - Should be 200 OK

**If any are 404 (red), that's the problem!**

---

## Common Causes & Solutions

### Cause 1: App Already Installed
**Symptom:** Event never fires
**Solution:** Uninstall from `chrome://apps`

### Cause 2: Service Worker Failed
**Symptom:** Console shows SW errors
**Solution:** Check `sw.js` for syntax errors

### Cause 3: Manifest Invalid
**Symptom:** DevTools shows manifest errors
**Solution:** Fix manifest.webmanifest

### Cause 4: Icons Missing
**Symptom:** 404 errors for icon files
**Solution:** Generate icons with `create-icons.html`

### Cause 5: Not Served Over HTTPS
**Symptom:** Event doesn't fire
**Solution:** Use `localhost` (you already are ✅)

### Cause 6: Browser Cache
**Symptom:** Old version cached
**Solution:** Clear browser data (Fix 2 above)

---

## Test in Incognito Mode

This rules out cache/extension issues:

1. Open Chrome/Edge
2. Press `Ctrl + Shift + N` (incognito)
3. Go to `http://localhost:5173`
4. Wait 10 seconds
5. Check console (F12)

**If it works in incognito but not normal mode:**
- Clear browser data in normal mode
- Disable extensions
- Check if app is installed

---

## What Should Happen

When everything is correct:

1. ✅ Page loads
2. ✅ Service worker registers (check DevTools)
3. ✅ Manifest loads (check DevTools)
4. ✅ After 1-5 seconds: `beforeinstallprompt` event fires
5. ✅ Console shows: `[PWA] beforeinstallprompt event fired!`
6. ✅ Install button appears in Navbar

---

## Debug Checklist

Use the debug page (`http://localhost:5173/debug-pwa.html`) and check:

- [ ] ✅ HTTPS or localhost
- [ ] ✅ Manifest file exists
- [ ] ✅ Service Worker registered
- [ ] ✅ Icons available
- [ ] ✅ Supported browser (Chrome/Edge)
- [ ] ✅ Not already installed
- [ ] ✅ beforeinstallprompt event ← This one is failing

**The debug page will show EXACTLY which item is failing!**

---

## Still Not Working?

### Check These Files:

1. **public/manifest.webmanifest** - Should exist and be valid JSON
2. **public/sw.js** - Should exist and have no syntax errors
3. **public/icon-192.png** - Should exist and be a valid PNG
4. **public/icon-512.png** - Should exist and be a valid PNG
5. **public/index.html** - Should have `<link rel="manifest" href="/manifest.webmanifest">`

### Get More Info:

1. Open debug page: `http://localhost:5173/debug-pwa.html`
2. Look at the "Real-Time Logs" section
3. Look at the "Console Output" section
4. Check which checklist items are ❌
5. The logs will tell you exactly what's wrong

---

## Quick Command Reference

```bash
# Clear Vite cache
rmdir /s /q node_modules\.vite

# Clear dist
rmdir /s /q dist

# Restart dev server
npm run dev

# Check if icons exist
dir public\icon*.png

# Check if manifest exists
type public\manifest.webmanifest
```

---

## Expected Timeline

After opening the app:
- **0-1 seconds:** Page loads
- **1-2 seconds:** Service worker registers
- **2-5 seconds:** `beforeinstallprompt` event fires
- **5+ seconds:** If no event, something is wrong

---

**Start with Fix 1 (check if already installed) and Fix 2 (clear browser data). These fix 90% of cases!**
