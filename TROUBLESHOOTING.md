# MedhaBangla - Troubleshooting Guide

## 🐛 Common Issues and Solutions

### Issue 1: Blank White Page

#### Symptoms
- Browser shows a blank white page
- No content loads
- Console may show errors

#### Possible Causes & Solutions

**1. Missing Dependencies**
```bash
# Solution: Install all dependencies
cd frontend/medhabangla
npm install

# If that doesn't work, try:
rm -rf node_modules package-lock.json
npm install
```

**2. Build/Compilation Errors**
```bash
# Check for TypeScript errors
npm run build

# If errors appear, fix them one by one
# Common fixes:
# - Check import paths
# - Ensure all files exist
# - Check for syntax errors
```

**3. Browser Console Errors**
```bash
# Open browser console (F12)
# Look for red error messages
# Common errors:

# Error: "Cannot find module"
# Solution: Check import paths in the file mentioned

# Error: "Unexpected token"
# Solution: Check for syntax errors in the file

# Error: "X is not defined"
# Solution: Check if variable/component is imported
```

**4. Port Already in Use**
```bash
# If port 5173 is in use:
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5173 | xargs kill -9

# Or change port in package.json:
"dev": "vite --port 3000"
```

**5. Environment Variables Not Set**
```bash
# Create .env file if missing
cp .env.example .env

# Edit .env and add your API keys:
VITE_WORKOS_CLIENT_ID=your_client_id
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_GEMINI_API_KEY=your_api_key
```

---

### Issue 2: PWA Components Not Loading

#### Symptoms
- OfflineIndicator or PWAInstallPrompt not showing
- Console errors about missing modules

#### Solutions

**1. Check if Dexie is installed**
```bash
npm install dexie
```

**2. Verify file structure**
```bash
# Ensure these files exist:
src/utils/db.ts
src/hooks/useNetworkStatus.ts
src/components/PWAInstallPrompt.tsx
src/components/OfflineIndicator.tsx
src/components/ErrorBoundary.tsx
```

**3. If PWA features cause issues, disable them temporarily**
```typescript
// In App.tsx, comment out:
// <OfflineIndicator />
// <PWAInstallPrompt />
```

---

### Issue 3: Service Worker Errors

#### Symptoms
- Console shows service worker registration failed
- PWA features not working

#### Solutions

**1. Service workers only work in production or HTTPS**
```bash
# For development, service worker is optional
# For production build:
npm run build
npm run preview
```

**2. Clear service worker cache**
```bash
# In Chrome DevTools:
# 1. Open Application tab
# 2. Click "Service Workers"
# 3. Click "Unregister"
# 4. Click "Clear storage"
# 5. Reload page
```

---

### Issue 4: API Connection Errors

#### Symptoms
- Cannot login
- API calls fail
- CORS errors

#### Solutions

**1. Check if backend is running**
```bash
# Start backend
cd backend
python manage.py runserver

# Should see: Starting development server at http://127.0.0.1:8000/
```

**2. Check API URL in frontend**
```bash
# In .env file:
VITE_API_URL=http://localhost:8000

# Or if using Docker:
VITE_API_URL=http://backend:8000
```

**3. CORS Issues**
```python
# In backend/medhabangla/settings.py
# Ensure CORS is configured:
CORS_ALLOW_ALL_ORIGINS = True  # For development
# Or for production:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://your-domain.com"
]
```

---

### Issue 5: Dark Mode Not Working

#### Symptoms
- Dark mode toggle doesn't work
- Theme doesn't persist

#### Solutions

**1. Check if DarkModeContext is wrapping App**
```typescript
// In App.tsx, ensure:
<DarkModeProvider>
  {/* App content */}
</DarkModeProvider>
```

**2. Check localStorage**
```javascript
// In browser console:
localStorage.getItem('darkMode')
// Should return 'true' or 'false'

// To reset:
localStorage.removeItem('darkMode')
```

**3. Check Tailwind dark mode config**
```javascript
// In tailwind.config.js:
module.exports = {
  darkMode: 'class', // Should be 'class'
  // ...
}
```

---

### Issue 6: Authentication Not Working

#### Symptoms
- Cannot login with Google
- Redirect fails
- Token not saved

#### Solutions

**1. Check WorkOS Configuration**
```bash
# Verify in .env:
VITE_WORKOS_CLIENT_ID=client_...
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback

# Ensure redirect URI matches exactly in WorkOS dashboard
```

**2. Check if backend is receiving auth requests**
```bash
# In backend terminal, should see:
# POST /api/accounts/workos-auth/
```

**3. Clear browser storage**
```javascript
// In browser console:
localStorage.clear()
sessionStorage.clear()
// Then try logging in again
```

---

### Issue 7: Build Errors

#### Symptoms
- `npm run build` fails
- TypeScript errors
- Module not found errors

#### Solutions

**1. Fix TypeScript errors**
```bash
# Check for errors:
npm run build

# Common fixes:
# - Add missing type definitions
# - Fix import paths
# - Add @ts-ignore for temporary fixes
```

**2. Check tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true
  }
}
```

**3. Clear build cache**
```bash
rm -rf dist node_modules/.vite
npm run build
```

---

### Issue 8: Slow Performance

#### Symptoms
- App loads slowly
- Laggy interactions
- High memory usage

#### Solutions

**1. Check Network tab in DevTools**
```bash
# Look for:
# - Large bundle sizes
# - Slow API calls
# - Many requests
```

**2. Optimize images**
```bash
# Compress images before uploading
# Use WebP format
# Lazy load images
```

**3. Enable production mode**
```bash
# Production builds are optimized:
npm run build
npm run preview
```

**4. Check for memory leaks**
```bash
# In Chrome DevTools:
# 1. Open Performance tab
# 2. Record while using app
# 3. Look for increasing memory usage
```

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console
```bash
# Open DevTools (F12)
# Look for errors in Console tab
# Red errors are critical
# Yellow warnings can usually be ignored
```

### Step 2: Check Network Tab
```bash
# Open DevTools → Network tab
# Reload page
# Look for failed requests (red)
# Check response status codes
```

### Step 3: Check Application Tab
```bash
# Open DevTools → Application tab
# Check:
# - Local Storage (for user data)
# - Session Storage
# - IndexedDB (for offline data)
# - Service Workers
```

### Step 4: Check Backend Logs
```bash
# In backend terminal:
# Look for error messages
# Check for 404, 500 errors
# Verify API endpoints are being hit
```

### Step 5: Test in Incognito Mode
```bash
# Open incognito/private window
# This rules out:
# - Extension conflicts
# - Cached data issues
# - Cookie problems
```

---

## 🛠 Quick Fixes

### Reset Everything
```bash
# Frontend
cd frontend/medhabangla
rm -rf node_modules package-lock.json dist
npm install
npm run dev

# Backend
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Clear All Caches
```bash
# Browser:
# 1. Open DevTools (F12)
# 2. Right-click refresh button
# 3. Select "Empty Cache and Hard Reload"

# Or:
# Chrome: chrome://settings/clearBrowserData
# Firefox: about:preferences#privacy
```

### Verify Installation
```bash
# Check Node version (should be 18+)
node --version

# Check npm version
npm --version

# Check Python version (should be 3.11+)
python --version

# Check if ports are available
# Windows:
netstat -ano | findstr :5173
netstat -ano | findstr :8000

# Linux/Mac:
lsof -i :5173
lsof -i :8000
```

---

## 📞 Getting Help

### Before Asking for Help

1. **Check this guide** - Most issues are covered here
2. **Check browser console** - Error messages are helpful
3. **Check backend logs** - API errors show here
4. **Try in incognito mode** - Rules out cache issues
5. **Check if backend is running** - Frontend needs backend

### Information to Provide

When asking for help, include:
- **Error message** (exact text from console)
- **Steps to reproduce** (what you did before error)
- **Browser and version** (Chrome 120, Firefox 121, etc.)
- **Operating system** (Windows 11, macOS 14, Ubuntu 22.04)
- **Node version** (`node --version`)
- **Python version** (`python --version`)
- **Screenshot** (if visual issue)

### Where to Get Help

- **Documentation**: Check `md/` folder
- **Setup Guide**: `SETUP_GUIDE.md`
- **API Docs**: `md/API_DOCS.md`
- **Deployment Guide**: `md/production-by-kiro.md`

---

## ✅ Verification Checklist

Use this checklist to verify everything is working:

### Frontend
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts server
- [ ] Browser opens to http://localhost:5173
- [ ] Home page loads
- [ ] No console errors
- [ ] Can navigate to /login
- [ ] Dark mode toggle works

### Backend
- [ ] `pip install -r requirements.txt` completes
- [ ] `python manage.py migrate` runs successfully
- [ ] `python manage.py runserver` starts
- [ ] Can access http://localhost:8000/admin
- [ ] API endpoints respond
- [ ] No error logs

### Integration
- [ ] Frontend can call backend APIs
- [ ] Login flow works
- [ ] Data saves to database
- [ ] PWA features work (optional)
- [ ] Offline mode works (optional)

---

## 🎯 Most Common Solution

**90% of blank page issues are solved by:**

```bash
# 1. Install dependencies
cd frontend/medhabangla
npm install

# 2. Check .env file exists
ls .env  # Should exist

# 3. Start dev server
npm run dev

# 4. Open browser console (F12)
# Look for error messages

# 5. If you see import errors:
# Check that all imported files exist
# Fix any typos in import paths

# 6. If you see "Cannot find module 'dexie'":
npm install dexie

# 7. If still blank:
# Comment out PWA components in App.tsx temporarily
```

---

**Last Updated**: December 21, 2025
**Version**: 1.0
