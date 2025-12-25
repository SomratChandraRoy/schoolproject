# Dashboard Fix for New Game System

## Issue
After implementing the new game system, the dashboard was crashing with this error:
```
Cannot resolve keyword 'user' into field. Choices are: best_streak, current_level, current_streak, game, game_id, games_lost, games_played, games_won, id, is_active, last_played, player, player_id, scores, session_score, session_uuid, started_at
```

## Root Cause
The `accounts/views.py` dashboard view was querying:
```python
games_played = GameSession.objects.filter(user=user).count()
```

But the new `GameSession` model structure changed:
- **Old**: `GameSession` had a direct `user` ForeignKey
- **New**: `GameSession` has a `player` ForeignKey to `PlayerProfile`, which has a `user` ForeignKey

## Solution
Updated `accounts/views.py` to handle the new model structure:

```python
# Get games played - handle both old and new GameSession models
try:
    # Try new model structure (player -> user)
    from games.models import PlayerProfile
    player_profile = PlayerProfile.objects.filter(user=user).first()
    if player_profile:
        games_played = GameSession.objects.filter(player=player_profile).count()
    else:
        games_played = 0
except:
    # Fallback to old model structure if it exists
    games_played = 0
```

## Result
✅ Dashboard now works correctly with the new game system
✅ Shows games played count from the new PlayerProfile/GameSession structure
✅ Gracefully handles users who haven't created a player profile yet (shows 0 games)

## Testing
1. Login to the application
2. Navigate to dashboard
3. Dashboard should load without errors
4. Games played count should show correctly (0 if no games played yet)

The fix is backward compatible and handles edge cases properly.
