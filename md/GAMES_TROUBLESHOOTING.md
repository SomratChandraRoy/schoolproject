# 🔧 Games System Troubleshooting Guide

## Error: "games.map is not a function"

### Problem
The frontend is trying to map over `games` but it's not an array, causing the application to crash.

### Solution Applied ✅
Updated `GamesHub.tsx` to:
1. Check if data is an array before using it
2. Show proper error messages
3. Add retry functionality
4. Log detailed error information

### Root Causes & Fixes

#### 1. Backend Not Running
**Symptom**: Network error, connection refused

**Check**:
```bash
# Try accessing the API directly
curl http://localhost:8000/api/games/api/games/
```

**Fix**:
```bash
cd S.P-by-Bipul-Roy/backend
.\venv\Scripts\activate
python manage.py runserver
```

#### 2. Wrong API Endpoint
**Symptom**: 404 Not Found error

**Check**: Open browser console (F12) and look for failed requests

**Current Endpoint**: `/api/games/api/games/`

**Fix if needed**: Update `gameService.ts`:
```typescript
const API_BASE_URL = '/api/games';  // Should be correct
```

#### 3. Authentication Issue
**Symptom**: 401 Unauthorized or 403 Forbidden

**Check**: 
```javascript
// In browser console
localStorage.getItem('token')
```

**Fix**: Login again to get a fresh token

#### 4. CORS Issue
**Symptom**: CORS policy error in console

**Check**: Backend settings.py should have:
```python
CORS_ALLOW_ALL_ORIGINS = True  # For development
```

**Fix**: Already configured in settings.py

#### 5. Database Not Migrated
**Symptom**: Database errors in backend logs

**Check**:
```bash
python manage.py showmigrations games
```

**Fix**:
```bash
python manage.py migrate games
python manage.py init_games
```

## Step-by-Step Debugging

### Step 1: Check Backend
```bash
cd S.P-by-Bipul-Roy/backend
.\venv\Scripts\activate

# Check if server runs
python manage.py runserver

# Should see:
# Starting development server at http://127.0.0.1:8000/
```

### Step 2: Test API Directly
Open browser and go to:
```
http://localhost:8000/api/games/api/games/
```

**Expected**: JSON array of games
```json
[
  {
    "id": 1,
    "game_type": "memory_pattern",
    "name": "Memory Pattern",
    ...
  }
]
```

**If you see login page**: You need authentication

**If you see 404**: Check URL configuration

### Step 3: Check Frontend Console
1. Open browser (http://localhost:5173/games)
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for errors

**What to look for**:
- `Games data received:` - Should show array
- `Sessions data received:` - Should show array
- Network errors - Backend not running
- 401/403 errors - Authentication issue

### Step 4: Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Refresh page
4. Look for failed requests (red)

**Check these requests**:
- `/api/games/api/profiles/get_profile/`
- `/api/games/api/games/`
- `/api/games/api/sessions/player_sessions/`

**Click on failed request** to see:
- Status code
- Response data
- Request headers

## Common Error Messages

### "Network Error"
**Cause**: Backend not running
**Fix**: Start backend server

### "404 Not Found"
**Cause**: Wrong URL or endpoint doesn't exist
**Fix**: Check URL configuration, verify routes

### "401 Unauthorized"
**Cause**: No token or invalid token
**Fix**: Login again

### "500 Internal Server Error"
**Cause**: Backend error (database, code error)
**Fix**: Check backend console for error details

### "Failed to load games"
**Cause**: API call failed
**Fix**: Check backend is running, check console for details

## Quick Fixes

### Fix 1: Restart Everything
```bash
# Terminal 1 - Stop and restart backend
Ctrl+C
python manage.py runserver

# Terminal 2 - Stop and restart frontend
Ctrl+C
npm run dev
```

### Fix 2: Clear Browser Cache
1. Open Developer Tools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Fix 3: Check Token
```javascript
// In browser console
localStorage.getItem('token')

// If null or undefined, login again
```

### Fix 4: Reinitialize Games
```bash
cd backend
python manage.py shell

from games.models import Game
Game.objects.all().delete()

exit()

python manage.py init_games
```

### Fix 5: Check Database
```bash
python manage.py shell

from games.models import Game
print(Game.objects.count())  # Should be 8

from games.models import PlayerProfile
print(PlayerProfile.objects.count())  # Should be > 0 after first visit
```

## Verification Checklist

- [ ] Backend server is running (http://localhost:8000)
- [ ] Frontend server is running (http://localhost:5173)
- [ ] Can access admin panel (http://localhost:8000/admin)
- [ ] Games are initialized (8 games in database)
- [ ] User is logged in (token in localStorage)
- [ ] No errors in browser console
- [ ] No errors in backend console
- [ ] API endpoints return data (test in browser)

## Testing the Fix

### Test 1: Load Games Hub
1. Navigate to http://localhost:5173/games
2. Should see loading spinner
3. Should see games hub with 8 games
4. Should see leaderboard on right

### Test 2: Check Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Should see:
   - "Games data received: [...]"
   - "Sessions data received: [...]"
4. Should NOT see errors

### Test 3: Play a Game
1. Click "Play Now" on Memory Pattern
2. Should navigate to game page
3. Click "Start Game"
4. Should see pattern display
5. Should be able to click colors

## Still Having Issues?

### Get Detailed Logs

**Backend logs**:
```bash
# In backend terminal, you'll see all requests
# Look for errors or 500 status codes
```

**Frontend logs**:
```javascript
// In browser console
// Check for red error messages
// Check Network tab for failed requests
```

### Check File Integrity

**Verify files exist**:
```bash
# Backend
ls backend/games/models.py
ls backend/games/views.py
ls backend/games/urls.py

# Frontend
ls frontend/medhabangla/src/services/gameService.ts
ls frontend/medhabangla/src/pages/games/GamesHub.tsx
```

### Manual API Test

**Test with curl**:
```bash
# Get token first (login via browser, then check localStorage)
TOKEN="your_token_here"

# Test games endpoint
curl -H "Authorization: Token $TOKEN" http://localhost:8000/api/games/api/games/

# Test profile endpoint
curl -H "Authorization: Token $TOKEN" http://localhost:8000/api/games/api/profiles/get_profile/
```

## Success Indicators

✅ **Backend Running**: See "Starting development server" message
✅ **Frontend Running**: See "Local: http://localhost:5173"
✅ **Games Load**: See 8 game cards on /games page
✅ **No Console Errors**: Clean console in browser
✅ **API Responds**: Can access http://localhost:8000/api/games/api/games/
✅ **Profile Created**: Can see player stats at top of games hub

## Contact Points

If all else fails:
1. Check all documentation files in `/md` folder
2. Review `GAMES_QUICK_START.md` for setup steps
3. Review `GAMES_FULL_INTEGRATION_COMPLETE.md` for architecture
4. Check backend logs for specific error messages
5. Check browser console for frontend errors

## Prevention

To avoid issues in the future:
1. Always start backend before frontend
2. Keep both servers running while developing
3. Check console regularly for errors
4. Test API endpoints after backend changes
5. Clear cache after major updates
