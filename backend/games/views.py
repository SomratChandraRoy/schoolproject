from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import Game, GameSession, GameLeaderboard
from .serializers import GameSerializer, GameSessionSerializer, GameLeaderboardSerializer
from accounts.models import User


class GameListView(generics.ListAPIView):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    permission_classes = [permissions.IsAuthenticated]


class StartGameView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        game_id = request.data.get('game_id')
        
        try:
            game = Game.objects.get(id=game_id)
            
            # Check if user's class level is within game requirements
            if user.class_level and (user.class_level < game.min_class_level or user.class_level > game.max_class_level):
                return Response({
                    'error': 'Game not available for your class level'
                }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if user has enough points to play (threshold: 20 points)
            if user.total_points < 20:
                return Response({
                    'error': 'You need at least 20 points to play games. Take some quizzes to earn points!'
                }, status=status.HTTP_403_FORBIDDEN)
            
            return Response({
                'message': 'Game started successfully',
                'game': GameSerializer(game).data
            })
            
        except Game.DoesNotExist:
            return Response({'error': 'Game not found'}, status=status.HTTP_404_NOT_FOUND)


class EndGameView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        game_id = request.data.get('game_id')
        score = request.data.get('score')
        duration = request.data.get('duration')  # in seconds
        
        try:
            game = Game.objects.get(id=game_id)
            
            # Save game session
            game_session = GameSession.objects.create(
                user=user,
                game=game,
                score=score,
                duration=duration
            )
            
            # Update leaderboard
            leaderboard_entry, created = GameLeaderboard.objects.get_or_create(
                user=user,
                game=game,
                defaults={'highest_score': score}
            )
            
            # Update highest score if current score is higher
            if score > leaderboard_entry.highest_score:
                leaderboard_entry.highest_score = score
                leaderboard_entry.save()
            
            # Award points for playing (optional)
            points_awarded = score // 10  # 1 point for every 10 game points
            user.total_points += points_awarded
            user.save()
            
            return Response({
                'message': 'Game session recorded successfully',
                'points_awarded': points_awarded,
                'leaderboard_entry': GameLeaderboardSerializer(leaderboard_entry).data
            })
            
        except Game.DoesNotExist:
            return Response({'error': 'Game not found'}, status=status.HTTP_404_NOT_FOUND)


class LeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, game_id):
        leaderboard = GameLeaderboard.objects.filter(game_id=game_id)[:10]  # Top 10 players
        serializer = GameLeaderboardSerializer(leaderboard, many=True)
        return Response(serializer.data)