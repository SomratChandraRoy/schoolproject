# Games API URL Fix - Complete

## Issue Fixed
The games page was showing "No games available yet" because of incorrect API endpoint URLs causing double nesting (`/api/games/api/games/` instead of `/api/games/games/`).

## Root Cause
- Main URL config: `path('api/games/', include('games.urls'))`
- Games router was using: `router.register(r'api/games', GameViewSet)`
- This created double nesting: `/api/games/` + `/api/games/` = `/api/games/api/games/`

## Changes Made

### 1. Backend - Fixed URL Router (`backend/games/urls.py`)
```python
# BEFORE (incorrect - double nesting)
router.register(r'api/games', GameViewSet, basename='game')
router.register(r'api/profiles', PlayerProfileViewSet, basename='profile')
router.register(r'api/sessions', GameSessionViewSet, basename='session')
router.register(r'api/leaderboard', LeaderboardViewSet, basename='leaderboard')
router.register(r'api/achievements', AchievementViewSet, basename='achievement')

# AFTER (correct - single nesting)
router.register(r'games', GameViewSet, basename='game')
router.register(r'profiles', PlayerProfileViewSet, basename='profile')
router.register(r'sessions', GameSessionViewSet, basename='session')
router.register(r'leaderboard', LeaderboardViewSet, basename='leaderboard')
router.register(r'achievements', AchievementViewSet, basename='achievement')
```

### 2. Frontend - Fixed API Calls (`frontend/medhabangla/src/services/gameService.ts`)
Updated all API endpoints to remove the extra `/api/` prefix:

```typescript
// BEFORE (incorrect)
async getAllGames(): Promise<GameData[]> {
    const response = await this.api.get('/api/games/');
    return response.data;
}

// AFTER (correct)
async getAllGames(): Promise<GameData[]> {
    const response = await this.api.get('/games/');
    return response.data;
}
```

All endpoints updated:
- `/api/games/` → `/games/`
- `/api/profiles/` → `/profiles/`
- `/api/sessions/` → `/sessions/`
- `/api/leaderboard/` → `/leaderboard/`
- `/api/achievements/` → `/achievements/`

### 3. Enhanced Debugging
Added comprehensive logging to `gameService.ts`:

```typescript
// Request interceptor with logging
this.api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'Present' : 'Missing');
    console.log('Request URL:', config.url);
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

// Response interceptor for debugging
this.api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.config.url, response.status);
        return response;
    },
    (error) => {
        console.error('API Error:', error.config?.url, error.response?.status, error.response?.data);
        return Promise.reject(error);
    }
);
```

## Correct API Endpoints

With base URL `/api/games`, the final endpoints are:

| Endpoint | Full URL | Method | Description |
|----------|----------|--------|-------------|
| Games | `/api/games/games/` | GET | List all active games |
| Games by Grade | `/api/games/games/by_grade/?grade=6` | GET | Filter games by grade |
| Create Profile | `/api/games/profiles/create_profile/` | POST | Create player profile |
| Get Profile | `/api/games/profiles/get_profile/` | GET | Get current user profile |
| Update Preferences | `/api/games/profiles/update_preferences/` | PATCH | Update player preferences |
| Start Session | `/api/games/sessions/start_session/` | POST | Start/resume game session |
| Submit Score | `/api/games/sessions/submit_score/` | POST | Submit game score |
| Player Sessions | `/api/games/sessions/player_sessions/` | GET | Get user's game sessions |
| Global Leaderboard | `/api/games/leaderboard/global_top/?limit=10` | GET | Top players globally |
| Game Leaderboard | `/api/games/leaderboard/game_top/?game_type=memory_pattern&limit=10` | GET | Top players per game |
| Grade Leaderboard | `/api/games/leaderboard/grade_top/?grade=6&limit=10` | GET | Top players by grade |
| All Achievements | `/api/games/achievements/` | GET | List all achievements |
| Player Achievements | `/api/games/achievements/player_achievements/` | GET | User's earned achievements |

## Testing

### 1. Verify Backend is Running
```bash
# Check if server is running on port 8000
netstat -ano | Select-String ":8000"

# Test API endpoint (should return 401 without auth)
curl http://localhost:8000/api/games/games/
# Expected: {"detail":"Authentication credentials were not provided."}
```

### 2. Verify Frontend is Running
```bash
# Check if frontend is running on port 5173
netstat -ano | Select-String ":5173"
```

### 3. Test in Browser
1. Open browser console (F12)
2. Navigate to `http://localhost:5173/games`
3. Check console logs:
   - "Token from localStorage: Present" (if logged in)
   - "Request URL: /games/"
   - "API Response: /games/ 200"
   - "Games data received: [...]"

### 4. Verify Games Load
- Games Hub should display 8 games
- Each game card should show:
  - Game name and description
  - Thumbnail/icon
  - Grade range
  - Base points
  - "Play Now" button

## Status
✅ Backend URL routing fixed
✅ Frontend API calls corrected
✅ Enhanced logging added
✅ Both servers confirmed running
✅ API endpoints responding correctly

## Next Steps
1. **Login to test**: User must be logged in to see games
2. **Check browser console**: Verify token is present and API calls succeed
3. **Test game flow**: Click "Play Now" on any game
4. **Verify leaderboard**: Check if leaderboard loads
5. **Test score submission**: Play a game and submit score

## Troubleshooting

### If games still don't load:
1. **Check if logged in**: Token must be in localStorage
2. **Check console**: Look for API errors
3. **Verify backend**: Ensure 8 games exist in database
4. **Check CORS**: Ensure frontend can access backend

### Verify games in database:
```bash
cd backend
python manage.py shell
```
```python
from games.models import Game
print(f"Total games: {Game.objects.count()}")
print(f"Active games: {Game.objects.filter(is_active=True).count()}")
for game in Game.objects.all():
    print(f"- {game.name} ({game.game_type})")
```

Expected output: 8 active games

## Files Modified
- `backend/games/urls.py` - Fixed router registration
- `frontend/medhabangla/src/services/gameService.ts` - Fixed all API endpoints and added logging

---
**Date**: December 25, 2024
**Status**: ✅ Complete - Ready for testing
