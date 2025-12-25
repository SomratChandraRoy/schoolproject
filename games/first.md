Complete Game Integration System - Multi-Game Architecture
I understand! You want to integrate a games section into your existing project and be able to add multiple games easily. Let me provide a complete modular architecture.

📁 PROJECT STRUCTURE (Integration into Existing Project)
text

your-existing-project/
├── backend/
│   ├── apps/
│   │   └── games/                    # NEW GAME APP
│   │       ├── migrations/
│   │       ├── __init__.py
│   │       ├── models.py
│   │       ├── serializers.py
│   │       ├── views.py
│   │       ├── urls.py
│   │       ├── admin.py
│   │       └── game_configs.py       # Game configurations
│   ├── your_project/
│   │   ├── settings.py               # UPDATE THIS
│   │   └── urls.py                   # UPDATE THIS
│   └── manage.py
└── frontend/
    └── src/
        ├── pages/
        │   └── games/                # NEW GAMES SECTION
        │       ├── GamesHub.jsx
        │       ├── MemoryGame/
        │       ├── PatternGame/
        │       ├── MathQuiz/
        │       └── WordPuzzle/
        ├── components/
        │   ├── games/                # SHARED GAME COMPONENTS
        │   │   ├── GameCard.jsx
        │   │   ├── GameLayout.jsx
        │   │   ├── ScoreDisplay.jsx
        │   │   ├── Leaderboard.jsx
        │   │   ├── GameTimer.jsx
        │   │   └── LevelIndicator.jsx
        │   └── ui/                   # YOUR EXISTING UI COMPONENTS
        ├── services/
        │   └── gameService.js        # API SERVICE
        ├── hooks/
        │   └── useGame.js            # CUSTOM HOOK
        └── App.jsx                   # UPDATE ROUTES
🔧 BACKEND - Django Game System
1. backend/apps/games/models.py
Python

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class Game(models.Model):
    """Master game configuration"""
    GAME_TYPES = [
        ('memory_pattern', 'Memory Pattern'),
        ('math_quiz', 'Math Quiz'),
        ('word_puzzle', 'Word Puzzle'),
        ('pattern_matching', 'Pattern Matching'),
        ('color_sequence', 'Color Sequence'),
    ]
    
    DIFFICULTY_LEVELS = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    game_type = models.CharField(max_length=50, choices=GAME_TYPES, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    thumbnail = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    min_grade = models.IntegerField(validators=[MinValueValidator(6), MaxValueValidator(12)], default=6)
    max_grade = models.IntegerField(validators=[MinValueValidator(6), MaxValueValidator(12)], default=12)
    base_points = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class PlayerProfile(models.Model):
    """Player gaming profile"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='game_profile', null=True, blank=True)
    session_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    player_name = models.CharField(max_length=100, default="Anonymous")
    grade = models.IntegerField(validators=[MinValueValidator(6), MaxValueValidator(12)], default=6)
    total_score = models.IntegerField(default=0)
    total_games_played = models.IntegerField(default=0)
    achievements = models.JSONField(default=dict, blank=True)
    preferences = models.JSONField(default=dict, blank=True)  # theme, sound, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-total_score']
    
    def __str__(self):
        return f"{self.player_name} - Total Score: {self.total_score}"


class GameSession(models.Model):
    """Individual game session tracking"""
    player = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE, related_name='sessions')
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='sessions')
    session_uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    current_level = models.IntegerField(default=1)
    session_score = models.IntegerField(default=0)
    games_played = models.IntegerField(default=0)
    games_won = models.IntegerField(default=0)
    games_lost = models.IntegerField(default=0)
    current_streak = models.IntegerField(default=0)
    best_streak = models.IntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    last_played = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-last_played']
        unique_together = ['player', 'game']
    
    def __str__(self):
        return f"{self.player.player_name} - {self.game.name} - Level {self.current_level}"


class GameScore(models.Model):
    """Individual game attempt/round score"""
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='scores')
    level = models.IntegerField()
    score = models.IntegerField()
    time_taken = models.FloatField()  # seconds
    accuracy = models.FloatField(default=100.0)  # percentage
    success = models.BooleanField(default=False)
    bonus_points = models.IntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)  # game-specific data
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.session.game.name} - Level {self.level} - {self.score} pts"


class Leaderboard(models.Model):
    """Global and per-game leaderboards"""
    LEADERBOARD_TYPES = [
        ('global', 'Global'),
        ('per_game', 'Per Game'),
        ('per_grade', 'Per Grade'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    player = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, null=True, blank=True)
    leaderboard_type = models.CharField(max_length=20, choices=LEADERBOARD_TYPES, default='per_game')
    rank = models.IntegerField(default=0)
    highest_level = models.IntegerField(default=1)
    total_score = models.IntegerField(default=0)
    grade = models.IntegerField(validators=[MinValueValidator(6), MaxValueValidator(12)], null=True, blank=True)
    period_start = models.DateTimeField(null=True, blank=True)
    period_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-total_score', '-highest_level']
        indexes = [
            models.Index(fields=['leaderboard_type', 'game', '-total_score']),
            models.Index(fields=['grade', '-total_score']),
        ]
    
    def __str__(self):
        return f"{self.player.player_name} - {self.leaderboard_type} - Rank {self.rank}"


class Achievement(models.Model):
    """Achievement definitions"""
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=50)  # emoji or icon name
    game = models.ForeignKey(Game, on_delete=models.CASCADE, null=True, blank=True)
    criteria = models.JSONField()  # {"type": "level", "value": 10}
    points = models.IntegerField(default=50)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name


class PlayerAchievement(models.Model):
    """Player earned achievements"""
    player = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE, related_name='earned_achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['player', 'achievement']
        ordering = ['-earned_at']
    
    def __str__(self):
        return f"{self.player.player_name} - {self.achievement.name}"
2. backend/apps/games/serializers.py
Python

from rest_framework import serializers
from .models import (
    Game, PlayerProfile, GameSession, GameScore, 
    Leaderboard, Achievement, PlayerAchievement
)


class GameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Game
        fields = '__all__'


class PlayerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlayerProfile
        fields = [
            'id', 'session_id', 'player_name', 'grade', 
            'total_score', 'total_games_played', 'achievements',
            'preferences', 'created_at', 'updated_at'
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
3. backend/apps/games/views.py
Python

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Max, Count
from .models import (
    Game, PlayerProfile, GameSession, GameScore,
    Leaderboard, Achievement, PlayerAchievement
)
from .serializers import (
    GameSerializer, PlayerProfileSerializer, GameSessionSerializer,
    GameScoreSerializer, LeaderboardSerializer, AchievementSerializer,
    PlayerAchievementSerializer
)
import uuid


class GameViewSet(viewsets.ModelViewSet):
    """Game management"""
    queryset = Game.objects.filter(is_active=True)
    serializer_class = GameSerializer
    
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
    
    @action(detail=False, methods=['post'])
    def create_profile(self, request):
        """Create new player profile"""
        session_id = str(uuid.uuid4())
        player_name = request.data.get('player_name', 'Anonymous')
        grade = request.data.get('grade', 6)
        
        profile = PlayerProfile.objects.create(
            session_id=session_id,
            player_name=player_name,
            grade=grade
        )
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def get_profile(self, request):
        """Get profile by session_id"""
        session_id = request.query_params.get('session_id')
        if not session_id:
            return Response(
                {'error': 'session_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        profile = get_object_or_404(PlayerProfile, session_id=session_id)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def update_preferences(self, request):
        """Update player preferences (theme, sound, etc.)"""
        session_id = request.data.get('session_id')
        preferences = request.data.get('preferences', {})
        
        profile = get_object_or_404(PlayerProfile, session_id=session_id)
        profile.preferences.update(preferences)
        profile.save()
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class GameSessionViewSet(viewsets.ModelViewSet):
    """Game session management"""
    queryset = GameSession.objects.all()
    serializer_class = GameSessionSerializer
    
    @action(detail=False, methods=['post'])
    def start_session(self, request):
        """Start or resume a game session"""
        player_session_id = request.data.get('player_session_id')
        game_type = request.data.get('game_type')
        
        player = get_object_or_404(PlayerProfile, session_id=player_session_id)
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
        """Get all sessions for a player"""
        player_session_id = request.query_params.get('player_session_id')
        player = get_object_or_404(PlayerProfile, session_id=player_session_id)
        
        sessions = self.queryset.filter(player=player)
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)


class LeaderboardViewSet(viewsets.ReadOnlyModelViewSet):
    """Leaderboard views"""
    queryset = Leaderboard.objects.all()
    serializer_class = LeaderboardSerializer
    
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
    
    @action(detail=False, methods=['get'])
    def player_achievements(self, request):
        """Get player's earned achievements"""
        player_session_id = request.query_params.get('player_session_id')
        player = get_object_or_404(PlayerProfile, session_id=player_session_id)
        
        earned = PlayerAchievement.objects.filter(player=player)
        serializer = PlayerAchievementSerializer(earned, many=True)
        return Response(serializer.data)
4. backend/apps/games/urls.py
Python

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GameViewSet, PlayerProfileViewSet, GameSessionViewSet,
    LeaderboardViewSet, AchievementViewSet
)

router = DefaultRouter()
router.register(r'games', GameViewSet, basename='game')
router.register(r'profiles', PlayerProfileViewSet, basename='profile')
router.register(r'sessions', GameSessionViewSet, basename='session')
router.register(r'leaderboard', LeaderboardViewSet, basename='leaderboard')
router.register(r'achievements', AchievementViewSet, basename='achievement')

urlpatterns = [
    path('', include(router.urls)),
]
5. backend/apps/games/admin.py
Python

from django.contrib import admin
from .models import (
    Game, PlayerProfile, GameSession, GameScore,
    Leaderboard, Achievement, PlayerAchievement
)


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ['name', 'game_type', 'min_grade', 'max_grade', 'is_active']
    list_filter = ['is_active', 'game_type']
    search_fields = ['name', 'description']


@admin.register(PlayerProfile)
class PlayerProfileAdmin(admin.ModelAdmin):
    list_display = ['player_name', 'grade', 'total_score', 'total_games_played', 'created_at']
    list_filter = ['grade', 'created_at']
    search_fields = ['player_name', 'session_id']


@admin.register(GameSession)
class GameSessionAdmin(admin.ModelAdmin):
    list_display = ['player', 'game', 'current_level', 'session_score', 'current_streak', 'last_played']
    list_filter = ['game', 'is_active', 'last_played']
    search_fields = ['player__player_name']


@admin.register(GameScore)
class GameScoreAdmin(admin.ModelAdmin):
    list_display = ['session', 'level', 'score', 'success', 'accuracy', 'created_at']
    list_filter = ['success', 'level', 'created_at']


@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    list_display = ['player', 'game', 'leaderboard_type', 'rank', 'total_score', 'highest_level']
    list_filter = ['leaderboard_type', 'game', 'grade']


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'game', 'points', 'is_active']
    list_filter = ['is_active', 'game']


@admin.register(PlayerAchievement)
class PlayerAchievementAdmin(admin.ModelAdmin):
    list_display = ['player', 'achievement', 'earned_at']
    list_filter = ['earned_at']
6. backend/apps/games/management/commands/init_games.py
Python

from django.core.management.base import BaseCommand
from apps.games.models import Game, Achievement


class Command(BaseCommand):
    help = 'Initialize games and achievements'

    def handle(self, *args, **kwargs):
        # Create games
        games_data = [
            {
                'game_type': 'memory_pattern',
                'name': 'Memory Pattern',
                'description': 'Remember and repeat the pattern of colors',
                'min_grade': 6,
                'max_grade': 12,
                'base_points': 100
            },
            {
                'game_type': 'math_quiz',
                'name': 'Math Challenge',
                'description': 'Solve math problems as fast as you can',
                'min_grade': 6,
                'max_grade': 12,
                'base_points': 150
            },
            {
                'game_type': 'word_puzzle',
                'name': 'Word Puzzle',
                'description': 'Find words in the puzzle grid',
                'min_grade': 6,
                'max_grade': 10,
                'base_points': 120
            },
            {
                'game_type': 'pattern_matching',
                'name': 'Pattern Match',
                'description': 'Match the patterns quickly',
                'min_grade': 6,
                'max_grade': 12,
                'base_points': 100
            }
        ]
        
        for game_data in games_data:
            Game.objects.get_or_create(
                game_type=game_data['game_type'],
                defaults=game_data
            )
        
        # Create achievements
        achievements_data = [
            {'code': 'LEVEL_5', 'name': 'Level 5 Master', 'description': 'Reach level 5', 'icon': '🏆', 'points': 50},
            {'code': 'LEVEL_10', 'name': 'Level 10 Master', 'description': 'Reach level 10', 'icon': '🥇', 'points': 100},
            {'code': 'LEVEL_20', 'name': 'Level 20 Master', 'description': 'Reach level 20', 'icon': '👑', 'points': 200},
            {'code': 'STREAK_5', 'name': '5 Win Streak', 'description': 'Win 5 games in a row', 'icon': '🔥', 'points': 75},
            {'code': 'STREAK_10', 'name': '10 Win Streak', 'description': 'Win 10 games in a row', 'icon': '⚡', 'points': 150},
            {'code': 'PERFECT_ROUND', 'name': 'Perfect!', 'description': 'Complete a round with 100% accuracy', 'icon': '💯', 'points': 50},
        ]
        
        for ach_data in achievements_data:
            Achievement.objects.get_or_create(
                code=ach_data['code'],
                defaults=ach_data
            )
        
        self.stdout.write(self.style.SUCCESS('Successfully initialized games and achievements'))
7. Update backend/your_project/urls.py
Python

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Your existing URLs
    path('api/auth/', include('your_auth_app.urls')),  # Example
    path('api/courses/', include('your_courses_app.urls')),  # Example
    
    # NEW: Games API
    path('api/games/', include('apps.games.urls')),
]
8. Update backend/your_project/settings.py
Python

INSTALLED_APPS = [
    # ... your existing apps
    'rest_framework',
    'corsheaders',
    
    # NEW
    'apps.games',
]

# CORS settings (if not already configured)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
]
🎮 FRONTEND - React Game System
1. frontend/src/services/gameService.js
JavaScript

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/games';

class GameService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
  }

  // Player Profile
  async createProfile(playerName, grade) {
    const response = await this.api.post('/profiles/create_profile/', {
      player_name: playerName,
      grade: grade,
    });
    return response.data;
  }

  async getProfile(sessionId) {
    const response = await this.api.get('/profiles/get_profile/', {
      params: { session_id: sessionId },
    });
    return response.data;
  }

  async updatePreferences(sessionId, preferences) {
    const response = await this.api.patch('/profiles/update_preferences/', {
      session_id: sessionId,
      preferences: preferences,
    });
    return response.data;
  }

  // Games
  async getAllGames() {
    const response = await this.api.get('/games/');
    return response.data;
  }

  async getGamesByGrade(grade) {
    const response = await this.api.get('/games/by_grade/', {
      params: { grade: grade },
    });
    return response.data;
  }

  // Game Session
  async startSession(playerSessionId, gameType) {
    const response = await this.api.post('/sessions/start_session/', {
      player_session_id: playerSessionId,
      game_type: gameType,
    });
    return response.data;
  }

  async submitScore(sessionUuid, scoreData) {
    const response = await this.api.post('/sessions/submit_score/', {
      session_uuid: sessionUuid,
      ...scoreData,
    });
    return response.data;
  }

  async getPlayerSessions(playerSessionId) {
    const response = await this.api.get('/sessions/player_sessions/', {
      params: { player_session_id: playerSessionId },
    });
    return response.data;
  }

  // Leaderboard
  async getGlobalLeaderboard(limit = 10) {
    const response = await this.api.get('/leaderboard/global_top/', {
      params: { limit },
    });
    return response.data;
  }

  async getGameLeaderboard(gameType, limit = 10) {
    const response = await this.api.get('/leaderboard/game_top/', {
      params: { game_type: gameType, limit },
    });
    return response.data;
  }

  async getGradeLeaderboard(grade, limit = 10) {
    const response = await this.api.get('/leaderboard/grade_top/', {
      params: { grade, limit },
    });
    return response.data;
  }

  // Achievements
  async getAllAchievements() {
    const response = await this.api.get('/achievements/');
    return response.data;
  }

  async getPlayerAchievements(playerSessionId) {
    const response = await this.api.get('/achievements/player_achievements/', {
      params: { player_session_id: playerSessionId },
    });
    return response.data;
  }
}

export default new GameService();
2. frontend/src/hooks/useGame.js
JavaScript

import { useState, useEffect, useCallback } from 'react';
import gameService from '../services/gameService';

export const useGame = (gameType) => {
  const [playerSession, setPlayerSession] = useState(null);
  const [gameSession, setGameSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializePlayer();
  }, []);

  const initializePlayer = async () => {
    try {
      let sessionId = localStorage.getItem('playerSessionId');
      
      if (sessionId) {
        const profile = await gameService.getProfile(sessionId);
        setPlayerSession(profile);
      } else {
        const profile = await gameService.createProfile('Student', 6);
        localStorage.setItem('playerSessionId', profile.session_id);
        setPlayerSession(profile);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const startGame = useCallback(async () => {
    if (!playerSession) return;
    
    try {
      const session = await gameService.startSession(
        playerSession.session_id,
        gameType
      );
      setGameSession(session.session);
      return session;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [playerSession, gameType]);

  const submitScore = useCallback(async (scoreData) => {
    if (!gameSession) return;
    
    try {
      const result = await gameService.submitScore(
        gameSession.session_uuid,
        scoreData
      );
      setGameSession(result.session);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [gameSession]);

  const updatePreferences = useCallback(async (preferences) => {
    if (!playerSession) return;
    
    try {
      const updated = await gameService.updatePreferences(
        playerSession.session_id,
        preferences
      );
      setPlayerSession(updated);
    } catch (err) {
      setError(err.message);
    }
  }, [playerSession]);

  return {
    playerSession,
    gameSession,
    loading,
    error,
    startGame,
    submitScore,
    updatePreferences,
  };
};

export const useLeaderboard = (gameType = null, grade = null) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [gameType, grade]);

  const fetchLeaderboard = async () => {
    try {
      let data;
      if (gameType) {
        data = await gameService.getGameLeaderboard(gameType);
      } else if (grade) {
        data = await gameService.getGradeLeaderboard(grade);
      } else {
        data = await gameService.getGlobalLeaderboard();
      }
      setLeaderboard(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setLoading(false);
    }
  };

  return { leaderboard, loading, refresh: fetchLeaderboard };
};
3. frontend/src/components/games/GameCard.jsx
React

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Play, Trophy, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GameCard({ game, session }) {
  const navigate = useNavigate();

  const handlePlay = () => {
    navigate(`/games/${game.game_type}`);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{game.name}</span>
          {session && (
            <span className="text-sm font-normal text-muted-foreground">
              Level {session.current_level}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {game.description}
        </p>
        
        {session && (
          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>{session.session_score} pts</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span>{session.games_won}/{session.games_played}</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Grades {game.min_grade}-{game.max_grade}
          </span>
          <Button onClick={handlePlay} className="gap-2">
            <Play className="h-4 w-4" />
            {session ? 'Continue' : 'Play'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
4. frontend/src/components/games/GameLayout.jsx
React

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import ScoreDisplay from './ScoreDisplay';

export default function GameLayout({ 
  children, 
  title, 
  gameSession,
  showBack = true 
}) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {showBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/games')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-2xl font-bold">{title}</h1>
            </div>
            
            {gameSession && <ScoreDisplay session={gameSession} />}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
5. frontend/src/components/games/ScoreDisplay.jsx
React

import React from 'react';
import { Trophy, Target, Zap, TrendingUp } from 'lucide-react';

export default function ScoreDisplay({ session, compact = false }) {
  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <Target className="h-4 w-4 text-primary" />
          <span className="font-bold">L{session.current_level}</span>
        </div>
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="font-bold">{session.session_score}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-orange-500" />
          <span className="font-bold">{session.current_streak}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="bg-card rounded-lg p-3 text-center border">
        <div className="flex justify-center mb-1">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div className="text-2xl font-bold">{session.current_level}</div>
        <div className="text-xs text-muted-foreground">Level</div>
      </div>
      
      <div className="bg-card rounded-lg p-3 text-center border">
        <div className="flex justify-center mb-1">
          <Trophy className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="text-2xl font-bold">{session.session_score}</div>
        <div className="text-xs text-muted-foreground">Score</div>
      </div>
      
      <div className="bg-card rounded-lg p-3 text-center border">
        <div className="flex justify-center mb-1">
          <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
        <div className="text-2xl font-bold">{session.games_played}</div>
        <div className="text-xs text-muted-foreground">Played</div>
      </div>
      
      <div className="bg-card rounded-lg p-3 text-center border">
        <div className="flex justify-center mb-1">
          <Zap className="h-5 w-5 text-orange-500" />
        </div>
        <div className="text-2xl font-bold">{session.current_streak}</div>
        <div className="text-xs text-muted-foreground">Streak</div>
      </div>
    </div>
  );
}
6. frontend/src/components/games/Leaderboard.jsx
React

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Trophy, Medal, Award } from 'lucide-react';
import { useLeaderboard } from '../../hooks/useGame';

export default function Leaderboard({ gameType = null, grade = null }) {
  const { leaderboard, loading } = useLeaderboard(gameType, grade);

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;
    if (index === 2) return <Award className="h-6 w-6 text-amber-600" />;
    return <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">Loading leaderboard...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={`
                flex items-center justify-between p-4 rounded-lg
                ${index < 3 ? 'bg-primary/10' : 'bg-muted'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 flex justify-center">
                  {getRankIcon(index)}
                </div>
                <div>
                  <div className="font-semibold">{entry.player_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Level {entry.highest_level}
                    {entry.grade && ` • Grade ${entry.grade}`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {entry.total_score.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
7. frontend/src/pages/games/GamesHub.jsx
React

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gameService from '../../services/gameService';
import GameCard from '../../components/games/GameCard';
import Leaderboard from '../../components/games/Leaderboard';
import ThemeToggle from '../../components/ThemeToggle';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Gamepad2, Trophy } from 'lucide-react';

export default function GamesHub() {
  const [games, setGames] = useState([]);
  const [sessions, setSessions] = useState({});
  const [playerProfile, setPlayerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadGamesAndProfile();
  }, []);

  const loadGamesAndProfile = async () => {
    try {
      // Get or create player profile
      let sessionId = localStorage.getItem('playerSessionId');
      let profile;
      
      if (sessionId) {
        profile = await gameService.getProfile(sessionId);
      } else {
        profile = await gameService.createProfile('Student', 6);
        localStorage.setItem('playerSessionId', profile.session_id);
      }
      
      setPlayerProfile(profile);

      // Load games
      const gamesData = await gameService.getAllGames();
      setGames(gamesData);

      // Load player sessions
      const sessionsData = await gameService.getPlayerSessions(profile.session_id);
      const sessionsMap = {};
      sessionsData.forEach(session => {
        sessionsMap[session.game_type] = session;
      });
      setSessions(sessionsMap);

      setLoading(false);
    } catch (error) {
      console.error('Error loading games:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading games...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Gamepad2 className="h-12 w-12" />
            <h1 className="text-4xl font-bold">Games Hub</h1>
          </div>
          <p className="text-xl opacity-90">
            Learn while having fun! Play educational games and track your progress.
          </p>
          
          {playerProfile && (
            <div className="mt-6 flex items-center gap-6 text-sm">
              <div>
                <span className="opacity-75">Total Score: </span>
                <span className="font-bold text-lg">{playerProfile.total_score}</span>
              </div>
              <div>
                <span className="opacity-75">Games Played: </span>
                <span className="font-bold text-lg">{playerProfile.total_games_played}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Games Grid */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Available Games</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {games.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  session={sessions[game.game_type]}
                />
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div>
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}
8. frontend/src/pages/games/MemoryGame/index.jsx
React

import React, { useState, useEffect } from 'react';
import { useGame } from '../../../hooks/useGame';
import GameLayout from '../../../components/games/GameLayout';
import GameBoard from './GameBoard';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Trophy, Play } from 'lucide-react';

export default function MemoryGame() {
  const { gameSession, loading, startGame, submitScore } = useGame('memory_pattern');
  const [isGameActive, setIsGameActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  useEffect(() => {
    if (!loading && !gameSession) {
      handleStartSession();
    }
  }, [loading]);

  const handleStartSession = async () => {
    try {
      await startGame();
      setIsGameActive(false);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleGameComplete = async (success, score, patternLength, timeTaken) => {
    setIsGameActive(false);
    
    try {
      const result = await submitScore({
        level: gameSession.current_level,
        score: score,
        time_taken: timeTaken,
        success: success,
        accuracy: success ? 100 : 0,
        metadata: { pattern_length: patternLength }
      });
      
      setLastResult(result);
      setShowResults(true);
      
      setTimeout(() => {
        setShowResults(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const handlePlayAgain = () => {
    setShowResults(false);
    setIsGameActive(true);
  };

  if (loading || !gameSession) {
    return (
      <GameLayout title="Memory Pattern">
        <div className="text-center py-12">Loading game...</div>
      </GameLayout>
    );
  }

  return (
    <GameLayout title="Memory Pattern" gameSession={gameSession}>
      <div className="max-w-4xl mx-auto">
        {showResults && lastResult && (
          <Card className="mb-6 bg-primary/10 border-primary">
            <CardContent className="p-6">
              <div className="text-center">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                <h3 className="text-2xl font-bold mb-2">
                  {lastResult.score.success ? 'Great Job! 🎉' : 'Try Again! 💪'}
                </h3>
                <div className="flex justify-center gap-8 text-lg">
                  <div>
                    <span className="text-muted-foreground">Score: </span>
                    <span className="font-bold">{lastResult.score.score}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time: </span>
                    <span className="font-bold">{lastResult.score.time_taken.toFixed(2)}s</span>
                  </div>
                  {lastResult.score.bonus_points > 0 && (
                    <div>
                      <span className="text-muted-foreground">Bonus: </span>
                      <span className="font-bold text-green-500">+{lastResult.score.bonus_points}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isGameActive ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Play?</h2>
              <p className="text-muted-foreground mb-6">
                Watch the pattern carefully, then repeat it!
              </p>
              <p className="text-lg mb-8">
                Current Level: <span className="font-bold text-primary">{gameSession.current_level}</span>
              </p>
              <Button size="lg" onClick={() => setIsGameActive(true)} className="gap-2">
                <Play className="h-5 w-5" />
                Start Game
              </Button>
            </CardContent>
          </Card>
        ) : (
          <GameBoard
            level={gameSession.current_level}
            onGameComplete={handleGameComplete}
          />
        )}

        {/* Instructions */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-bold mb-3">How to Play:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Watch the sequence of colors light up</li>
              <li>• Click the colors in the same order</li>
              <li>• Complete the pattern correctly to level up</li>
              <li>• Higher levels have longer patterns and more colors</li>
              <li>• Earn bonus points for speed and accuracy</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </GameLayout>
  );
}
9. frontend/src/pages/games/MemoryGame/GameBoard.jsx
React

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Play, RotateCcw } from 'lucide-react';

const COLORS = [
  { id: 0, bg: 'bg-red-500', active: 'bg-red-300', name: 'red' },
  { id: 1, bg: 'bg-blue-500', active: 'bg-blue-300', name: 'blue' },
  { id: 2, bg: 'bg-green-500', active: 'bg-green-300', name: 'green' },
  { id: 3, bg: 'bg-yellow-500', active: 'bg-yellow-300', name: 'yellow' },
  { id: 4, bg: 'bg-purple-500', active: 'bg-purple-300', name: 'purple' },
  { id: 5, bg: 'bg-pink-500', active: 'bg-pink-300', name: 'pink' },
  { id: 6, bg: 'bg-orange-500', active: 'bg-orange-300', name: 'orange' },
  { id: 7, bg: 'bg-teal-500', active: 'bg-teal-300', name: 'teal' },
];

export default function GameBoard({ level, onGameComplete }) {
  const [pattern, setPattern] = useState([]);
  const [userPattern, setUserPattern] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [activeCell, setActiveCell] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState('Click Start to begin!');
  const [startTime, setStartTime] = useState(null);

  const getPatternLength = useCallback(() => {
    return Math.min(3 + level, 15);
  }, [level]);

  const getGridSize = useCallback(() => {
    if (level <= 3) return 4;
    if (level <= 6) return 6;
    return 8;
  }, [level]);

  const gridSize = getGridSize();
  const patternLength = getPatternLength();

  const generatePattern = useCallback(() => {
    const newPattern = [];
    for (let i = 0; i < patternLength; i++) {
      newPattern.push(Math.floor(Math.random() * gridSize));
    }
    return newPattern;
  }, [patternLength, gridSize]);

  const showPattern = useCallback(async (patternToShow) => {
    setIsPlaying(true);
    setMessage('Watch carefully...');
    
    for (let i = 0; i < patternToShow.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setActiveCell(patternToShow[i]);
      await new Promise(resolve => setTimeout(resolve, 400));
      setActiveCell(null);
    }
    
    setIsPlaying(false);
    setIsUserTurn(true);
    setMessage('Now repeat the pattern!');
    setStartTime(Date.now());
  }, []);

  const startGame = useCallback(() => {
    const newPattern = generatePattern();
    setPattern(newPattern);
    setUserPattern([]);
    setGameStarted(true);
    setIsUserTurn(false);
    showPattern(newPattern);
  }, [generatePattern, showPattern]);

  const handleCellClick = (cellId) => {
    if (!isUserTurn || isPlaying) return;

    const newUserPattern = [...userPattern, cellId];
    setUserPattern(newUserPattern);
    
    setActiveCell(cellId);
    setTimeout(() => setActiveCell(null), 300);

    if (pattern[newUserPattern.length - 1] !== cellId) {
      setMessage('Wrong! Try again.');
      setIsUserTurn(false);
      const timeTaken = (Date.now() - startTime) / 1000;
      
      setTimeout(() => {
        onGameComplete(false, 0, patternLength, timeTaken);
        setGameStarted(false);
        setMessage('Click Start to try again!');
      }, 1500);
      return;
    }

    if (newUserPattern.length === pattern.length) {
      const timeTaken = (Date.now() - startTime) / 1000;
      const score = Math.round(1000 * (patternLength / timeTaken));
      
      setMessage('Perfect! Well done! 🎉');
      setIsUserTurn(false);
      
      setTimeout(() => {
        onGameComplete(true, score, patternLength, timeTaken);
        setGameStarted(false);
        setMessage('Click Start for next level!');
      }, 1500);
    }
  };

  const cols = gridSize === 4 ? 2 : gridSize === 6 ? 3 : 4;
  
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="mb-6 text-center">
          <p className="text-lg font-medium mb-4">{message}</p>
          
          <div className="flex gap-4 justify-center">
            <Button
              onClick={startGame}
              disabled={gameStarted}
              size="lg"
              className="gap-2"
            >
              <Play className="h-5 w-5" />
              {gameStarted ? 'Game in Progress' : 'Start Game'}
            </Button>
            
            {gameStarted && (
              <Button
                onClick={() => {
                  setGameStarted(false);
                  setIsUserTurn(false);
                  setMessage('Click Start to begin!');
                }}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <RotateCcw className="h-5 w-5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        <div 
          className="grid gap-4 mb-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {COLORS.slice(0, gridSize).map((color) => (
            <button
              key={color.id}
              onClick={() => handleCellClick(color.id)}
              disabled={!isUserTurn || isPlaying}
              className={`
                aspect-square rounded-lg transition-all duration-200 transform
                ${activeCell === color.id ? color.active + ' scale-95' : color.bg}
                ${isUserTurn && !isPlaying ? 'hover:scale-105 cursor-pointer' : 'cursor-not-allowed opacity-70'}
                disabled:cursor-not-allowed
              `}
            />
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>Pattern Length: {patternLength} | Grid: {cols}x{Math.ceil(gridSize/cols)}</p>
          {isUserTurn && (
            <p className="mt-2 text-primary font-medium">
              Progress: {userPattern.length}/{pattern.length}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
10. Update frontend/src/App.jsx
React

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Your existing pages
import Home from './pages/Home';
import Courses from './pages/Courses';
// ... other pages

// NEW: Game pages
import GamesHub from './pages/games/GamesHub';
import MemoryGame from './pages/games/MemoryGame';

import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Your existing routes */}
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        
        {/* NEW: Game routes */}
        <Route path="/games" element={<GamesHub />} />
        <Route path="/games/memory_pattern" element={<MemoryGame />} />
        {/* Add more games here as you create them */}
        
      </Routes>
    </Router>
  );
}

export default App();
📋 SETUP COMMANDS
Backend Setup:
Bash

cd backend

# Create games app
python manage.py startapp apps/games

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Initialize games data
python manage.py init_games

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
Frontend - No new installation needed (integrate into existing):
Bash

cd frontend

# If you don't have these packages:
npm install axios react-router-dom

# Run development server
npm run dev
🎯 HOW TO ADD NEW GAMES
1. Add game to database:
Python

# In Django admin or shell
Game.objects.create(
    game_type='new_game_type',
    name='New Game Name',
    description='Game description',
    min_grade=6,
    max_grade=12,
    base_points=100
)
2. Create new game component:
text

frontend/src/pages/games/NewGame/
├── index.jsx
└── GameBoard.jsx
3. Add route in App.jsx:
React

<Route path="/games/new_game_type" element={<NewGame />} />
🚀 READY TO USE!
Navigate to:

Games Hub: http://localhost:5173/games
Memory Game: http://localhost:5173/games/memory_pattern
Admin Panel:

http://localhost:8000/admin
This architecture is fully scalable and ready for multiple games! Each game follows the same pattern, making it easy to add new ones. 🎮






