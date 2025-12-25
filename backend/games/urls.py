from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GameViewSet, PlayerProfileViewSet, GameSessionViewSet,
    LeaderboardViewSet, AchievementViewSet,
    # Legacy views
    GameListView, StartGameView, EndGameView, LegacyLeaderboardView
)

router = DefaultRouter()
router.register(r'games', GameViewSet, basename='game')
router.register(r'profiles', PlayerProfileViewSet, basename='profile')
router.register(r'sessions', GameSessionViewSet, basename='session')
router.register(r'leaderboard', LeaderboardViewSet, basename='leaderboard')
router.register(r'achievements', AchievementViewSet, basename='achievement')

urlpatterns = [
    # New API endpoints
    path('', include(router.urls)),
    
    # Legacy endpoints for backward compatibility
    path('list/', GameListView.as_view(), name='game-list-legacy'),
    path('start/', StartGameView.as_view(), name='start-game'),
    path('end/', EndGameView.as_view(), name='end-game'),
    path('leaderboard/<int:game_id>/', LegacyLeaderboardView.as_view(), name='leaderboard-legacy'),
]