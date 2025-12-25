from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import User
import uuid


class Game(models.Model):
    """Master game configuration"""
    GAME_TYPES = [
        ('memory_pattern', 'Memory Pattern'),
        ('memory_matrix', 'Memory Matrix'),
        ('math_quiz', 'Math Challenge'),
        ('equation_storm', 'Equation Storm'),
        ('word_puzzle', 'Word Puzzle'),
        ('pattern_matching', 'Pattern Match'),
        ('pathfinder', 'Pathfinder'),
        ('infinite_loop', 'Infinite Loop'),
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
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='game_profile')
    session_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    player_name = models.CharField(max_length=100)
    grade = models.IntegerField(validators=[MinValueValidator(6), MaxValueValidator(12)], default=6)
    total_score = models.IntegerField(default=0)
    total_games_played = models.IntegerField(default=0)
    achievements = models.JSONField(default=dict, blank=True)
    preferences = models.JSONField(default=dict, blank=True)
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
    metadata = models.JSONField(default=dict, blank=True)
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


# Keep old model for backward compatibility
class GameLeaderboard(models.Model):
    """Legacy leaderboard model - kept for backward compatibility"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    highest_score = models.IntegerField(default=0)
    last_played = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'game')
        ordering = ['-highest_score']
    
    def __str__(self):
        return f"{self.user.username} - {self.game.name} - High Score: {self.highest_score}"