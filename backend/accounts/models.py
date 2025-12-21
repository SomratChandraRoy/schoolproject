from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class User(AbstractUser):
    CLASS_CHOICES = [(i, f'Class {i}') for i in range(6, 13)]
    
    # Override last_name to allow NULL values for OAuth users
    last_name = models.CharField(max_length=150, blank=True, null=True)
    
    class_level = models.IntegerField(choices=CLASS_CHOICES, null=True, blank=True)
    fav_subjects = models.JSONField(default=list, blank=True)
    disliked_subjects = models.JSONField(default=list, blank=True)
    total_points = models.IntegerField(default=0)
    is_teacher = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    
    # Google OAuth fields
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    profile_picture = models.URLField(max_length=500, null=True, blank=True)
    
    # Study tracking fields
    total_study_time = models.PositiveIntegerField(default=0)  # Total minutes studied
    current_streak = models.PositiveIntegerField(default=0)    # Consecutive days studied
    longest_streak = models.PositiveIntegerField(default=0)   # Longest study streak
    
    def __str__(self):
        return self.username

class StudySession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=100)
    duration = models.PositiveIntegerField(validators=[MinValueValidator(1)])  # in minutes
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.subject} - {self.duration} minutes"
