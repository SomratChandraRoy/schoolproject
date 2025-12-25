# 🎮 Games System - Quick Start Guide

## ✅ Status: Ready to Use!

The games system is fully integrated and operational. Follow these steps to start using it.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start Backend
```bash
cd S.P-by-Bipul-Roy/backend
.\venv\Scripts\activate
python manage.py runserver
```

### Step 2: Start Frontend
```bash
cd S.P-by-Bipul-Roy/frontend/medhabangla
npm run dev
```

### Step 3: Play!
1. Open browser: `http://localhost:5173`
2. Login to your account
3. Click "Games" in navbar
4. Choose a game and play!

---

## 🎯 What You Can Do Now

### Play Games
- Navigate to `/games` or click "Games" in navbar
- See 8 available games
- Click "Play Now" on any game
- Complete patterns to earn points

### Track Progress
- View your total score
- See games played count
- Check your current level per game
- Monitor your win streak

### Compete
- Check global leaderboard
- See top 10 players
- Compare scores
- Climb the rankings

### Earn Achievements
- Reach level milestones
- Build win streaks
- Get perfect scores
- Unlock all 9 achievements

---

## 📱 User Interface

### Games Hub (`/games`)
```
┌─────────────────────────────────────────┐
│  🎮 Games Hub                           │
│  Learn while having fun!                │
│  Total Score: 0 | Games Played: 0       │
├─────────────────────────────────────────┤
│  Available Games          │ Leaderboard │
│  ┌──────┐ ┌──────┐       │ 🥇 Player1  │
│  │ 🧠   │ │ 🎯   │       │ 🥈 Player2  │
│  │Memory│ │Matrix│       │ 🥉 Player3  │
│  └──────┘ └──────┘       │             │
└─────────────────────────────────────────┘
```

### Game Page (`/games/memory_pattern`)
```
┌─────────────────────────────────────────┐
│  ← Back    🧠 Memory Pattern            │
│  Level: 1 | Score: 0 | Streak: 0       │
├─────────────────────────────────────────┤
│  Ready to Play?                         │
│  Watch the pattern carefully,           │
│  then repeat it!                        │
│                                         │
│  Current Level: 1                       │
│  [▶️ Start Game]                        │
├─────────────────────────────────────────┤
│  How to Play:                           │
│  • Watch the sequence of colors         │
│  • Click the colors in the same order   │
│  • Complete the pattern to level up     │
└─────────────────────────────────────────┘
```

---

## 🎮 How to Play Memory Pattern

1. **Click "Start Game"**
   - Game generates a random pattern

2. **Watch Carefully**
   - Colors will light up in sequence
   - Remember the order

3. **Repeat the Pattern**
   - Click the colors in the same order
   - Progress bar shows your progress

4. **Complete Successfully**
   - Earn points based on speed
   - Get bonus points for accuracy
   - Level up automatically

5. **Keep Playing**
   - Patterns get longer
   - More colors appear
   - Difficulty increases

---

## 🏆 Scoring System

### Base Score
- Calculated based on pattern length and time
- Formula: `1000 * (pattern_length / time_taken)`

### Bonus Points
- **Speed Bonus**: +50 pts (complete in < 10 seconds)
- **Perfect Accuracy**: +100 pts (100% correct)
- **Win Streak**: +10 pts per streak (after 5+ wins)

### Example
```
Pattern Length: 5
Time Taken: 8.5 seconds
Base Score: 1000 * (5 / 8.5) = 588 pts
Speed Bonus: +50 pts (< 10 seconds)
Accuracy Bonus: +100 pts (100% correct)
Total: 738 pts
```

---

## 📊 Features Overview

### ✅ Implemented
- 8 games available
- Player profiles
- Session management
- Score tracking
- Level progression
- Win streaks
- Leaderboards (global, per-game, per-grade)
- 9 achievements
- Dark mode
- Responsive design
- Real-time updates

### 🎯 Game Features
- Dynamic difficulty
- Pattern generation
- Timer tracking
- Progress display
- Result animations
- Instructions
- Reset option

---

## 🔧 Admin Features

### Django Admin
Access: `http://localhost:8000/admin/`

**Manage**:
- Games (add/edit/delete)
- Player Profiles
- Game Sessions
- Scores
- Leaderboards
- Achievements
- Player Achievements

### Add New Game
```python
python manage.py shell

from games.models import Game
Game.objects.create(
    game_type='new_game',
    name='New Game Name',
    description='Game description',
    min_grade=6,
    max_grade=12,
    base_points=100
)
```

---

## 🐛 Troubleshooting

### Games Not Loading?
1. Check backend is running: `http://localhost:8000/admin/`
2. Check frontend is running: `http://localhost:5173/`
3. Check browser console for errors (F12)
4. Verify you're logged in

### Can't Submit Scores?
1. Check network tab (F12) for API errors
2. Verify token in localStorage
3. Check backend logs for errors
4. Ensure game session started

### Dashboard Error?
- ✅ Already fixed! Dashboard now works with new game system

### No Games Showing?
```bash
cd backend
python manage.py init_games
```

---

## 📱 Mobile Support

The games system is fully responsive:
- ✅ Works on phones
- ✅ Works on tablets
- ✅ Works on desktop
- ✅ Touch-friendly controls
- ✅ Optimized layouts

---

## 🎨 Customization

### Change Game Colors
Edit: `frontend/src/pages/games/MemoryPattern/GameBoard.tsx`
```typescript
const COLORS = [
  { id: 0, bg: 'bg-red-500', active: 'bg-red-300', name: 'red' },
  // Add more colors...
];
```

### Adjust Difficulty
Edit: `frontend/src/pages/games/MemoryPattern/GameBoard.tsx`
```typescript
const getPatternLength = () => {
  return Math.min(3 + level, 15); // Change formula
};
```

### Modify Scoring
Edit: `backend/games/views.py`
```python
# In submit_score method
if success:
    if time_taken < 10:
        bonus_points += 50  # Change bonus
```

---

## 📚 API Endpoints

### Get All Games
```bash
GET /api/games/api/games/
Authorization: Token YOUR_TOKEN
```

### Start Game Session
```bash
POST /api/games/api/sessions/start_session/
Authorization: Token YOUR_TOKEN
Content-Type: application/json

{
  "game_type": "memory_pattern"
}
```

### Submit Score
```bash
POST /api/games/api/sessions/submit_score/
Authorization: Token YOUR_TOKEN
Content-Type: application/json

{
  "session_uuid": "SESSION_UUID",
  "level": 1,
  "score": 1000,
  "time_taken": 8.5,
  "success": true,
  "accuracy": 100.0
}
```

### Get Leaderboard
```bash
GET /api/games/api/leaderboard/global_top/?limit=10
Authorization: Token YOUR_TOKEN
```

---

## 🎉 You're Ready!

The games system is fully operational. Start playing and have fun! 🎮

**Quick Links**:
- Games Hub: `http://localhost:5173/games`
- Admin Panel: `http://localhost:8000/admin/`
- API Docs: See `GAMES_FULL_INTEGRATION_COMPLETE.md`

**Need Help?**
- Check `GAMES_FULL_INTEGRATION_COMPLETE.md` for detailed documentation
- Check `GAMES_SYSTEM_IMPLEMENTATION.md` for technical details
- Check browser console (F12) for errors
- Check backend logs for API errors

Happy Gaming! 🚀
