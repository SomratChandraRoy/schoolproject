from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import (
    Game, PlayerProfile, GameSession, GameScore,
    Leaderboard, Achievement, PlayerAchievement, GameLeaderboard
)


@admin.register(Game)
class GameAdmin(ModelAdmin):
    list_display = ['name', 'game_type', 'min_grade', 'max_grade', 'is_active', 'base_points']
    list_filter = ['is_active', 'game_type', 'min_grade', 'max_grade']
    search_fields = ['name', 'description']


@admin.register(PlayerProfile)
class PlayerProfileAdmin(ModelAdmin):
    list_display = ['player_name', 'user', 'grade', 'total_score', 'total_games_played', 'created_at']
    list_filter = ['grade', 'created_at']
    search_fields = ['player_name', 'session_id', 'user__username']
    readonly_fields = ['session_id', 'created_at', 'updated_at']


@admin.register(GameSession)
class GameSessionAdmin(ModelAdmin):
    list_display = ['player', 'game', 'current_level', 'session_score', 'current_streak', 'last_played']
    list_filter = ['game', 'is_active', 'last_played']
    search_fields = ['player__player_name', 'player__user__username']
    readonly_fields = ['session_uuid', 'started_at', 'last_played']


@admin.register(GameScore)
class GameScoreAdmin(ModelAdmin):
    list_display = ['session', 'level', 'score', 'success', 'accuracy', 'time_taken', 'created_at']
    list_filter = ['success', 'level', 'created_at']
    readonly_fields = ['created_at']


@admin.register(Leaderboard)
class LeaderboardAdmin(ModelAdmin):
    list_display = ['player', 'game', 'leaderboard_type', 'rank', 'total_score', 'highest_level']
    list_filter = ['leaderboard_type', 'game', 'grade']
    search_fields = ['player__player_name']


@admin.register(Achievement)
class AchievementAdmin(ModelAdmin):
    list_display = ['name', 'code', 'game', 'points', 'is_active']
    list_filter = ['is_active', 'game']
    search_fields = ['name', 'code']


@admin.register(PlayerAchievement)
class PlayerAchievementAdmin(ModelAdmin):
    list_display = ['player', 'achievement', 'earned_at']
    list_filter = ['earned_at']
    search_fields = ['player__player_name', 'achievement__name']
    readonly_fields = ['earned_at']


@admin.register(GameLeaderboard)
class GameLeaderboardAdmin(ModelAdmin):
    list_display = ('user', 'game', 'highest_score', 'last_played')
    list_filter = ('game', 'last_played')
    search_fields = ('user__username', 'game__name')