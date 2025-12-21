from django.urls import path
from .views import GameListView, StartGameView, EndGameView, LeaderboardView

urlpatterns = [
    path('', GameListView.as_view(), name='game-list'),
    path('start/', StartGameView.as_view(), name='start-game'),
    path('end/', EndGameView.as_view(), name='end-game'),
    path('leaderboard/<int:game_id>/', LeaderboardView.as_view(), name='leaderboard'),
]