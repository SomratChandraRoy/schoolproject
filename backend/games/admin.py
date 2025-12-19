from django.contrib import admin
from .models import Game, GameSession, GameLeaderboard

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('name', 'game_type', 'min_class_level', 'max_class_level')
    list_filter = ('game_type', 'min_class_level', 'max_class_level')
    search_fields = ('name', 'game_type')

@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'score', 'duration', 'completed_at')
    list_filter = ('game', 'completed_at')
    search_fields = ('user__username', 'game__name')

@admin.register(GameLeaderboard)
class GameLeaderboardAdmin(admin.ModelAdmin):
    list_display = ('user', 'game', 'highest_score', 'last_played')
    list_filter = ('game', 'last_played')
    search_fields = ('user__username', 'game__name')