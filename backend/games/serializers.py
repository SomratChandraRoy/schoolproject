from rest_framework import serializers
from .models import Game, GameSession, GameLeaderboard


class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = '__all__'


class GameSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameSession
        fields = '__all__'
        read_only_fields = ('user',)


class GameLeaderboardSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = GameLeaderboard
        fields = '__all__'
        read_only_fields = ('user',)