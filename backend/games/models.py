from django.db import models
from accounts.models import User


class Game(models.Model):
    GAME_TYPE_CHOICES = [
        ('memory_matrix', 'Memory Matrix'),
        ('equation_storm', 'Equation Storm'),
        ('pathfinder', 'Pathfinder'),
        ('infinite_loop', 'Infinite Loop'),
    ]
    
    name = models.CharField(max_length=100)
    game_type = models.CharField(max_length=20, choices=GAME_TYPE_CHOICES)
    description = models.TextField()
    min_class_level = models.IntegerField(default=6)
    max_class_level = models.IntegerField(default=12)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class GameSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    duration = models.IntegerField(help_text="Duration in seconds")
    completed_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.game.name} - {self.score} points"


class GameLeaderboard(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    highest_score = models.IntegerField(default=0)
    last_played = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'game')
        ordering = ['-highest_score']
    
    def __str__(self):
        return f"{self.user.username} - {self.game.name} - High Score: {self.highest_score}"