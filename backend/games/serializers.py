from rest_framework import serializers
from .models import (
    Game, PlayerProfile, GameSession, GameScore, 
    Leaderboard, Achievement, PlayerAchievement, GameLeaderboard
)


class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = '__all__'


class PlayerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = PlayerProfile
        fields = [
            'id', 'session_id', 'player_name', 'grade', 
            'total_score', 'total_games_played', 'achievements',
            'preferences', 'created_at', 'updated_at', 'username'
        ]
        read_only_fields = ['session_id', 'total_score', 'total_games_played']


class GameScoreSerializer(serializers.ModelSerializer):
    game_name = serializers.CharField(source='session.game.name', read_only=True)
    
    class Meta:
        model = GameScore
        fields = [
            'id', 'level', 'score', 'time_taken', 'accuracy',
            'success', 'bonus_points', 'metadata', 'created_at', 'game_name'
        ]


class GameSessionSerializer(serializers.ModelSerializer):
    game_name = serializers.CharField(source='game.name', read_only=True)
    game_type = serializers.CharField(source='game.game_type', read_only=True)
    recent_scores = GameScoreSerializer(source='scores', many=True, read_only=True)
    
    class Meta:
        model = GameSession
        fields = [
            'id', 'session_uuid', 'game_name', 'game_type',
            'current_level', 'session_score', 'games_played',
            'games_won', 'games_lost', 'current_streak', 'best_streak',
            'started_at', 'last_played', 'is_active', 'recent_scores'
        ]


class LeaderboardSerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(source='player.player_name', read_only=True)
    game_name = serializers.CharField(source='game.name', read_only=True)
    
    class Meta:
        model = Leaderboard
        fields = [
            'id', 'player_name', 'game_name', 'leaderboard_type',
            'rank', 'highest_level', 'total_score', 'grade', 'created_at'
        ]


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'


class PlayerAchievementSerializer(serializers.ModelSerializer):
    achievement_data = AchievementSerializer(source='achievement', read_only=True)
    
    class Meta:
        model = PlayerAchievement
        fields = ['id', 'achievement_data', 'earned_at']


# Legacy serializer for backward compatibility
class GameLeaderboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = GameLeaderboard
        fields = '__all__'
        read_only_fields = ('user',)