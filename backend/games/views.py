from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Max, Count
from django.utils import timezone
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


DEFAULT_GAME_CONFIGS = {
    'image_dragger': {
        'name': 'Image Dragger',
        'description': 'Drag puzzle pieces into the correct place before time runs out.',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 180,
        'is_active': True,
    },
    'math_quiz': {
        'name': 'MathRush',
        'description': 'Solve endless math challenges as fast as you can in a polished game UI.',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 150,
        'is_active': True,
    },
    'molecular_memory_mechanics': {
        'name': 'Molecular Memory & Mechanics',
        'description': 'Play the live molecular memory and mechanics challenge hosted on a dedicated subdomain.',
        'min_grade': 6,
        'max_grade': 12,
        'base_points': 170,
        'is_active': True,
    },
}

REMOVED_GAME_TYPES = {'memory_pattern', 'ship_find', 'number_hunt'}


class GameViewSet(viewsets.ModelViewSet):
    """Game management"""
    serializer_class = GameSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Hide deprecated games from hub/API responses.
        Game.objects.filter(game_type__in=REMOVED_GAME_TYPES, is_active=True).update(is_active=False)

        # Ensure core games exist so the frontend hub can list them reliably.
        for game_type, defaults in DEFAULT_GAME_CONFIGS.items():
            Game.objects.get_or_create(game_type=game_type, defaults=defaults)

        return Game.objects.filter(is_active=True)
    
    @action(detail=False, methods=['get'])
    def by_grade(self, request):
        """Get games suitable for a grade"""
        grade = request.query_params.get('grade', 6)
        games = self.get_queryset().filter(
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

    def _get_or_create_game(self, game_type):
        """Resolve game by type and auto-create known game configs when missing."""
        defaults = DEFAULT_GAME_CONFIGS.get(game_type)

        if defaults:
            game, _ = Game.objects.get_or_create(game_type=game_type, defaults=defaults)
            return game

        return get_object_or_404(Game, game_type=game_type)

    def _get_image_difficulty(self, iq_level, level):
        """Create a difficulty profile from IQ and current level."""
        safe_iq = max(70, min(int(iq_level or 100), 160))
        safe_level = max(1, int(level or 1))

        base_grid = 3 + min((safe_level - 1) // 3, 2)
        iq_modifier = 0
        if safe_iq >= 130:
            iq_modifier = 2
        elif safe_iq >= 115:
            iq_modifier = 1
        elif safe_iq <= 85:
            iq_modifier = -1

        grid_size = max(3, min(base_grid + iq_modifier, 6))

        base_time_limit = {
            3: 190,
            4: 215,
            5: 245,
            6: 280,
        }.get(grid_size, 190)
        iq_time_penalty = max(0, int((safe_iq - 100) * 1.4))
        time_limit = max(60, base_time_limit - iq_time_penalty)

        return {
            'iq_level': safe_iq,
            'grid_size': grid_size,
            'time_limit_seconds': time_limit,
        }

    def _update_image_dragger_preferences(self, player, game_score):
        """Persist rolling IQ and performance history for image dragger rounds."""
        preferences = player.preferences or {}
        image_state = preferences.get('image_dragger', {})
        metadata = game_score.metadata or {}

        grid_size = max(3, int(metadata.get('grid_size', 3) or 3))
        move_count = max(1, int(metadata.get('move_count', metadata.get('moves', 1)) or 1))
        time_limit = max(60.0, float(metadata.get('time_limit', grid_size * grid_size * 12) or 60.0))

        previous_iq = max(70, min(int(image_state.get('iq_level', 100) or 100), 160))
        ideal_moves = max(10.0, float((grid_size * grid_size) + (grid_size * 2)))
        move_efficiency = max(0.2, min(1.6, ideal_moves / float(move_count)))
        time_efficiency = max(0.2, min(1.6, time_limit / max(game_score.time_taken, 1.0)))
        accuracy_efficiency = max(0.2, min(1.2, game_score.accuracy / 100.0))
        completion_efficiency = 1.0 if game_score.success else 0.35
        level_efficiency = min(1.3, 1.0 + ((game_score.level - 1) * 0.03))

        target_iq = int(round(
            75
            + (completion_efficiency * 32)
            + (move_efficiency * 18)
            + (time_efficiency * 16)
            + (accuracy_efficiency * 12)
            + (level_efficiency * 10)
        ))
        target_iq = max(70, min(target_iq, 160))
        new_iq = int(round((previous_iq * 0.72) + (target_iq * 0.28)))

        games_played = int(image_state.get('games_played', 0) or 0) + 1
        games_won = int(image_state.get('games_won', 0) or 0) + (1 if game_score.success else 0)
        total_time = float(image_state.get('total_time', 0.0) or 0.0) + float(game_score.time_taken)
        best_time = image_state.get('best_time')
        if game_score.success:
            best_time = float(game_score.time_taken) if best_time is None else min(float(best_time), float(game_score.time_taken))

        history = image_state.get('iq_history', [])
        history.append({
            'played_at': timezone.now().isoformat(),
            'iq_level': new_iq,
            'level': int(game_score.level),
            'grid_size': grid_size,
            'time_taken': float(game_score.time_taken),
            'success': bool(game_score.success),
        })

        image_state.update({
            'iq_level': new_iq,
            'games_played': games_played,
            'games_won': games_won,
            'win_rate': round((games_won / games_played) * 100, 2),
            'best_time': best_time,
            'avg_time': round(total_time / games_played, 2),
            'total_time': round(total_time, 2),
            'highest_level': max(int(image_state.get('highest_level', 1) or 1), int(game_score.level)),
            'last_grid_size': grid_size,
            'last_move_count': move_count,
            'last_time_limit': int(time_limit),
            'iq_history': history[-40:],
            'updated_at': timezone.now().isoformat(),
        })

        preferences['image_dragger'] = image_state
        player.preferences = preferences
    
    @action(detail=False, methods=['post'])
    def start_session(self, request):
        """Start or resume a game session"""
        user = request.user
        game_type = str(request.data.get('game_type', '')).strip().lower()

        if not game_type:
            return Response(
                {'error': 'game_type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create player profile
        player, _ = PlayerProfile.objects.get_or_create(
            user=user,
            defaults={
                'player_name': user.username,
                'grade': getattr(user, 'class_level', 6)
            }
        )
        
        game = self._get_or_create_game(game_type)

        if not game.is_active:
            return Response(
                {'error': 'This game is currently disabled'},
                status=status.HTTP_403_FORBIDDEN
            )
        
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

        try:
            level = int(request.data.get('level', 1) or 1)
            score = int(request.data.get('score', 0) or 0)
            time_taken = float(request.data.get('time_taken', 0) or 0)
            accuracy = float(request.data.get('accuracy', 100.0) or 100.0)
        except (TypeError, ValueError):
            return Response(
                {'error': 'Invalid numeric fields in score payload'},
                status=status.HTTP_400_BAD_REQUEST
            )

        success_value = request.data.get('success', False)
        if isinstance(success_value, str):
            success = success_value.strip().lower() in ['1', 'true', 'yes', 'on']
        else:
            success = bool(success_value)

        level = max(level, 1)
        score = max(score, 0)
        time_taken = max(time_taken, 0.0)
        accuracy = max(0.0, min(accuracy, 100.0))

        metadata = request.data.get('metadata', {})

        if not isinstance(metadata, dict):
            metadata = {}

        if not session_uuid:
            return Response(
                {'error': 'session_uuid is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session = get_object_or_404(GameSession, session_uuid=session_uuid)

        if session.player.user_id != request.user.id:
            return Response(
                {'error': 'Session does not belong to the authenticated user'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Calculate bonus points
        bonus_points = 0
        if success:
            if time_taken > 0 and time_taken < 10:
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

        if session.game.game_type == 'image_dragger':
            self._update_image_dragger_preferences(player, game_score)

        player.save()
        
        # Update leaderboard
        self._update_leaderboard(session)
        
        # Check achievements
        self._check_achievements(session, game_score)
        
        return Response({
            'session': GameSessionSerializer(session).data,
            'score': GameScoreSerializer(game_score).data
        })

    @action(detail=False, methods=['get'])
    def image_dragger_profile(self, request):
        """Return adaptive IQ settings and play statistics for image dragger."""
        user = request.user

        player, _ = PlayerProfile.objects.get_or_create(
            user=user,
            defaults={
                'player_name': user.username,
                'grade': getattr(user, 'class_level', 6)
            }
        )

        image_state = (player.preferences or {}).get('image_dragger', {})
        iq_level = int(image_state.get('iq_level', 100) or 100)

        current_level = 1
        image_session = GameSession.objects.filter(
            player=player,
            game__game_type='image_dragger'
        ).first()
        if image_session:
            current_level = image_session.current_level

        difficulty = self._get_image_difficulty(iq_level, current_level)

        return Response({
            'iq_level': difficulty['iq_level'],
            'recommended_grid_size': difficulty['grid_size'],
            'recommended_time_limit': difficulty['time_limit_seconds'],
            'current_level': current_level,
            'games_played': int(image_state.get('games_played', 0) or 0),
            'games_won': int(image_state.get('games_won', 0) or 0),
            'win_rate': float(image_state.get('win_rate', 0.0) or 0.0),
            'best_time': image_state.get('best_time'),
            'avg_time': image_state.get('avg_time'),
            'last_grid_size': image_state.get('last_grid_size', 3),
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
