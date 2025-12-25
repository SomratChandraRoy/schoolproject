from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Max, Count
from .models import (
    Game, PlayerProfile, GameSession, GameScore,
    Leaderboard, Achievement, PlayerAchievement, GameLeaderboard
)
from .serializers import (
    GameSerializer, PlayerProfileSerializer, GameSessionSerializer,
    GameScoreSerializer, LeaderboardSerializer, AchievementSerializer,
    PlayerAchievementSerializer, GameLeaderboardSerializer
)
import uuid


class GameViewSet(viewsets.ModelViewSet):
    """Game management"""
    queryset = Game.objects.filter(is_active=True)
    serializer_class = GameSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_grade(self, request):
        """Get games suitable for a grade"""
        grade = request.query_params.get('grade', 6)
        games = self.queryset.filter(
            min_grade__lte=grade,
            max_grade__gte=grade
        )
        serializer = self.get_serializer(games, many=True)
        return Response(serializer.data)


class PlayerProfileViewSet(viewsets.ModelViewSet):
    """Player profile management"""
    queryset = PlayerProfile.objects.all()
    serializer_class = PlayerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def create_profile(self, request):
        """Create or get player profile for current user"""
        user = request.user
        player_name = request.data.get('player_name', user.username)
        grade = request.data.get('grade', getattr(user, 'class_level', 6))
        
        # Get or create profile
        profile, created = PlayerProfile.objects.get_or_create(
            user=user,
            defaults={
                'player_name': player_name,
                'grade': grade
            }
        )
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def get_profile(self, request):
        """Get profile for current user"""
        user = request.user
        
        # Get or create profile
        profile, created = PlayerProfile.objects.get_or_create(
            user=user,
            defaults={
                'player_name': user.username,
                'grade': getattr(user, 'class_level', 6)
            }
        )
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def update_preferences(self, request):
        """Update player preferences (theme, sound, etc.)"""
        user = request.user
        preferences = request.data.get('preferences', {})
        
        profile = get_object_or_404(PlayerProfile, user=user)
        profile.preferences.update(preferences)
        profile.save()
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class GameSessionViewSet(viewsets.ModelViewSet):
    """Game session management"""
    queryset = GameSession.objects.all()
    serializer_class = GameSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def start_session(self, request):
        """Start or resume a game session"""
        user = request.user
        game_type = request.data.get('game_type')
        
        # Get or create player profile
        player, _ = PlayerProfile.objects.get_or_create(
            user=user,
            defaults={
                'player_name': user.username,
                'grade': getattr(user, 'class_level', 6)
            }
        )
        
        game = get_object_or_404(Game, game_type=game_type)
        
        # Get or create session
        session, created = GameSession.objects.get_or_create(
            player=player,
            game=game,
            defaults={'is_active': True}
        )
        
        session.is_active = True
        session.save()
        
        serializer = self.get_serializer(session)
        return Response({
            'session': serializer.data,
            'is_new': created
        })
    
    @action(detail=False, methods=['post'])
    def submit_score(self, request):
        """Submit game score"""
        session_uuid = request.data.get('session_uuid')
        level = request.data.get('level')
        score = request.data.get('score')
        time_taken = request.data.get('time_taken')
        success = request.data.get('success', False)
        accuracy = request.data.get('accuracy', 100.0)
        metadata = request.data.get('metadata', {})
        
        session = get_object_or_404(GameSession, session_uuid=session_uuid)
        
        # Calculate bonus points
        bonus_points = 0
        if success:
            if time_taken < 10:
                bonus_points += 50
            if accuracy == 100:
                bonus_points += 100
            if session.current_streak > 5:
                bonus_points += session.current_streak * 10
        
        total_score = score + bonus_points
        
        # Create score record
        game_score = GameScore.objects.create(
            session=session,
            level=level,
            score=total_score,
            time_taken=time_taken,
            accuracy=accuracy,
            success=success,
            bonus_points=bonus_points,
            metadata=metadata
        )
        
        # Update session
        session.session_score += total_score
        session.games_played += 1
        
        if success:
            session.games_won += 1
            session.current_streak += 1
            session.best_streak = max(session.best_streak, session.current_streak)
            
            if level >= session.current_level:
                session.current_level = level + 1
        else:
            session.games_lost += 1
            session.current_streak = 0
        
        session.save()
        
        # Update player profile
        player = session.player
        player.total_score += total_score
        player.total_games_played += 1
        player.save()
        
        # Update leaderboard
        self._update_leaderboard(session)
        
        # Check achievements
        self._check_achievements(session, game_score)
        
        return Response({
            'session': GameSessionSerializer(session).data,
            'score': GameScoreSerializer(game_score).data
        })
    
    def _update_leaderboard(self, session):
        """Update leaderboard entries"""
        # Per-game leaderboard
        leaderboard, created = Leaderboard.objects.get_or_create(
            player=session.player,
            game=session.game,
            leaderboard_type='per_game',
            defaults={
                'highest_level': session.current_level,
                'total_score': session.session_score,
                'grade': session.player.grade
            }
        )
        
        if not created:
            leaderboard.highest_level = max(leaderboard.highest_level, session.current_level)
            leaderboard.total_score = session.session_score
            leaderboard.save()
        
        # Global leaderboard
        global_lb, created = Leaderboard.objects.get_or_create(
            player=session.player,
            leaderboard_type='global',
            defaults={
                'highest_level': session.current_level,
                'total_score': session.player.total_score,
                'grade': session.player.grade
            }
        )
        
        if not created:
            global_lb.total_score = session.player.total_score
            global_lb.save()
    
    def _check_achievements(self, session, game_score):
        """Check and award achievements"""
        player = session.player
        
        # Level-based achievements
        if session.current_level == 5:
            self._award_achievement(player, 'LEVEL_5')
        elif session.current_level == 10:
            self._award_achievement(player, 'LEVEL_10')
        elif session.current_level == 20:
            self._award_achievement(player, 'LEVEL_20')
        
        # Streak achievements
        if session.current_streak == 5:
            self._award_achievement(player, 'STREAK_5')
        elif session.current_streak == 10:
            self._award_achievement(player, 'STREAK_10')
        
        # Perfect score
        if game_score.accuracy == 100 and game_score.success:
            self._award_achievement(player, 'PERFECT_ROUND')
    
    def _award_achievement(self, player, achievement_code):
        """Award achievement to player"""
        try:
            achievement = Achievement.objects.get(code=achievement_code)
            PlayerAchievement.objects.get_or_create(
                player=player,
                achievement=achievement
            )
        except Achievement.DoesNotExist:
            pass
    
    @action(detail=False, methods=['get'])
    def player_sessions(self, request):
        """Get all sessions for current user"""
        user = request.user
        
        try:
            player = PlayerProfile.objects.get(user=user)
            sessions = self.queryset.filter(player=player)
            serializer = self.get_serializer(sessions, many=True)
            return Response(serializer.data)
        except PlayerProfile.DoesNotExist:
            return Response([])


class LeaderboardViewSet(viewsets.ReadOnlyModelViewSet):
    """Leaderboard views"""
    queryset = Leaderboard.objects.all()
    serializer_class = LeaderboardSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def global_top(self, request):
        """Get global top players"""
        limit = int(request.query_params.get('limit', 10))
        leaderboard = self.queryset.filter(
            leaderboard_type='global'
        ).order_by('-total_score')[:limit]
        
        serializer = self.get_serializer(leaderboard, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def game_top(self, request):
        """Get top players for a specific game"""
        game_type = request.query_params.get('game_type')
        limit = int(request.query_params.get('limit', 10))
        
        game = get_object_or_404(Game, game_type=game_type)
        leaderboard = self.queryset.filter(
            leaderboard_type='per_game',
            game=game
        ).order_by('-total_score')[:limit]
        
        serializer = self.get_serializer(leaderboard, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def grade_top(self, request):
        """Get top players by grade"""
        grade = int(request.query_params.get('grade', 6))
        limit = int(request.query_params.get('limit', 10))
        
        leaderboard = self.queryset.filter(
            grade=grade,
            leaderboard_type='global'
        ).order_by('-total_score')[:limit]
        
        serializer = self.get_serializer(leaderboard, many=True)
        return Response(serializer.data)


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    """Achievement management"""
    queryset = Achievement.objects.filter(is_active=True)
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def player_achievements(self, request):
        """Get player's earned achievements"""
        user = request.user
        
        try:
            player = PlayerProfile.objects.get(user=user)
            earned = PlayerAchievement.objects.filter(player=player)
            serializer = PlayerAchievementSerializer(earned, many=True)
            return Response(serializer.data)
        except PlayerProfile.DoesNotExist:
            return Response([])


# Legacy views for backward compatibility
class GameListView(generics.ListAPIView):
    queryset = Game.objects.filter(is_active=True)
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
            if hasattr(user, 'class_level') and user.class_level:
                if user.class_level < game.min_grade or user.class_level > game.max_grade:
                    return Response({
                        'error': 'Game not available for your class level'
                    }, status=status.HTTP_403_FORBIDDEN)
            
            # Check if user has enough points to play (threshold: 20 points)
            if hasattr(user, 'total_points') and user.total_points < 20:
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
            if hasattr(user, 'total_points'):
                user.total_points += points_awarded
                user.save()
            
            return Response({
                'message': 'Game session recorded successfully',
                'points_awarded': points_awarded,
                'leaderboard_entry': GameLeaderboardSerializer(leaderboard_entry).data
            })
            
        except Game.DoesNotExist:
            return Response({'error': 'Game not found'}, status=status.HTTP_404_NOT_FOUND)


class LegacyLeaderboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, game_id):
        leaderboard = GameLeaderboard.objects.filter(game_id=game_id)[:10]  # Top 10 players
        serializer = GameLeaderboardSerializer(leaderboard, many=True)
        return Response(serializer.data)
