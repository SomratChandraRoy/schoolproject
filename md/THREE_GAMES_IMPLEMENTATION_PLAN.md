# Three Games Implementation Plan

## Overview
Implementing three educational games into the existing games system:
1. **Memory Pattern** (Already implemented)
2. **Ship Find** (Battleship-style memory game)
3. **Number Hunt** (Sequential number clicking game)

## Current Status

### ✅ Backend (Complete)
- Django models created
- API endpoints working
- Authentication integrated
- Leaderboard system ready
- Achievement system ready

### ⚠️ Issues to Fix
1. **Database Connection**: AWS RDS out of connections → Switch to SQLite
2. **API Pagination**: Fixed (extracting `results` from paginated response)
3. **URL Routing**: Fixed (removed double `/api/` nesting)

### 🎯 Frontend Tasks

#### 1. Ship Find Game
**Gameplay**: Find hidden ships on a grid by clicking cells
- Grid sizes: 6x6 (Level 1-3), 8x8 (Level 4-6), 10x10 (Level 7-10), 12x12 (Level 11+)
- Ships: 2-8 ships depending on level
- Scoring: Based on accuracy (hits/clicks ratio) and time
- Features:
  - Click to reveal cells
  - Track hits and misses
  - Show ship outlines when fully found
  - Level progression with more ships

#### 2. Number Hunt Game
**Gameplay**: Click numbers in sequential order (1→2→3...)
- Grid sizes: 3x3 (Level 1-2), 4x4 (Level 3-4), 5x5 (Level 5-6)
- Numbers: 6-25 numbers depending on level
- Memory challenge: Numbers hide after brief display (3s → 1.5s)
- Scoring: Based on speed and accuracy
- Features:
  - Memorization phase (numbers visible)
  - Playing phase (numbers hidden)
  - 3 lives system
  - Time tracking

#### 3. Memory Pattern (Already Implemented)
**Gameplay**: Watch and repeat color patterns
- Pattern length increases with level
- Grid size increases with level
- Scoring based on speed and accuracy

## Implementation Steps

### Step 1: Fix Database Connection ✅
```bash
# Update .env
USE_SQLITE=True

# Restart backend server
```

### Step 2: Initialize All Games in Database
```python
# Run management command
python manage.py shell
```

```python
from games.models import Game

games_data = [
    {
        'game_type': 'memory_pattern',
        'name': 'Memory Pattern',
        'description': 'Watch and repeat the color pattern. Test your memory!',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 100
    },
    {
        'game_type': 'ship_find',
        'name': 'Ship Find',
        'description': 'Find all hidden ships on the grid. Use your memory and strategy!',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 150
    },
    {
        'game_type': 'number_hunt',
        'name': 'Number Hunt',
        'description': 'Click numbers in order as fast as you can. Memory challenge!',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 120
    },
]

for game_data in games_data:
    Game.objects.get_or_create(
        game_type=game_data['game_type'],
        defaults=game_data
    )
```

### Step 3: Create Ship Find Game Components
Files to create:
- `frontend/medhabangla/src/pages/games/ShipFind/index.tsx`
- `frontend/medhabangla/src/pages/games/ShipFind/GameBoard.tsx`
- `frontend/medhabangla/src/pages/games/ShipFind/types.ts`

### Step 4: Create Number Hunt Game Components
Files to create:
- `frontend/medhabangla/src/pages/games/NumberHunt/index.tsx`
- `frontend/medhabangla/src/pages/games/NumberHunt/GameBoard.tsx`
- `frontend/medhabangla/src/pages/games/NumberHunt/types.ts`

### Step 5: Update App Routes
Add routes for new games in `App.tsx`:
```typescript
<Route path="/games/ship-find" element={<ShipFind />} />
<Route path="/games/number-hunt" element={<NumberHunt />} />
```

### Step 6: Update GameCard Component
Map game types to routes:
```typescript
const gameRoutes = {
  'memory_pattern': '/games/memory-pattern',
  'ship_find': '/games/ship-find',
  'number_hunt': '/games/number-hunt',
};
```

## Game Specifications

### Ship Find
```typescript
interface ShipFindConfig {
  level: number;
  gridSize: 6 | 8 | 10 | 12;
  shipCount: number; // 2-8
  shipLengths: number[]; // [4, 3, 3, 2, 2, 2, 1, 1]
}

const getShipFindConfig = (level: number): ShipFindConfig => {
  if (level <= 3) return { level, gridSize: 6, shipCount: 2, shipLengths: [3, 2] };
  if (level <= 6) return { level, gridSize: 8, shipCount: 4, shipLengths: [4, 3, 2, 2] };
  if (level <= 10) return { level, gridSize: 10, shipCount: 6, shipLengths: [4, 3, 3, 2, 2, 1] };
  return { level, gridSize: 12, shipCount: 8, shipLengths: [4, 3, 3, 2, 2, 2, 1, 1] };
};
```

### Number Hunt
```typescript
interface NumberHuntConfig {
  level: number;
  gridSize: 3 | 4 | 5;
  totalNumbers: number;
  memorizeTime: number; // milliseconds
}

const getNumberHuntConfig = (level: number): NumberHuntConfig => {
  if (level <= 2) return { level, gridSize: 3, totalNumbers: 6, memorizeTime: 3000 };
  if (level <= 4) return { level, gridSize: 4, totalNumbers: 12, memorizeTime: 2500 };
  return { level, gridSize: 5, totalNumbers: 20, memorizeTime: 2000 };
};
```

## Scoring System

### Ship Find
```typescript
const calculateShipFindScore = (
  level: number,
  clicks: number,
  ships: number,
  timeInSeconds: number
): number => {
  const baseScore = 1000;
  const levelMultiplier = level;
  const efficiencyBonus = Math.max(0, (ships * 3 - clicks) * 10);
  const timeBonus = Math.max(0, 500 - timeInSeconds);
  
  return Math.floor((baseScore + efficiencyBonus + timeBonus) * levelMultiplier);
};
```

### Number Hunt
```typescript
const calculateNumberHuntScore = (
  level: number,
  timeInSeconds: number,
  mistakes: number
): number => {
  const baseScore = 1000 * level;
  const timeBonus = Math.max(0, Math.floor((10000 - timeInSeconds * 1000) * 0.5));
  const mistakePenalty = mistakes * 100;
  
  return Math.max(0, baseScore + timeBonus - mistakePenalty);
};
```

## Testing Checklist

### Backend
- [ ] SQLite database working
- [ ] All 3 games in database
- [ ] API endpoints returning games
- [ ] Session creation working
- [ ] Score submission working
- [ ] Leaderboard updating

### Frontend
- [ ] Games Hub loads all 3 games
- [ ] Memory Pattern playable
- [ ] Ship Find playable
- [ ] Number Hunt playable
- [ ] Scores submit correctly
- [ ] Leaderboard updates
- [ ] Level progression works
- [ ] Dark mode works
- [ ] Responsive design works

## Next Steps
1. ✅ Fix database connection
2. ✅ Fix API pagination
3. ✅ Fix URL routing
4. 🔄 Initialize games in database
5. 🔄 Implement Ship Find
6. 🔄 Implement Number Hunt
7. 🔄 Test all games
8. 🔄 Fix any bugs

---
**Status**: Ready to implement Ship Find and Number Hunt games
**Date**: December 25, 2024
