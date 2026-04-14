from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class User(AbstractUser):
    CLASS_CHOICES = [(i, f'Class {i}') for i in range(6, 13)]

    ROLE_BAN = 'ban'
    ROLE_PRO = 'pro'
    ROLE_LITE = 'lite'
    ROLE_USER = 'user'
    ROLE_ENTERPRISE = 'enterprise'
    ROLE_CHOICES = [
        (ROLE_BAN, 'Ban'),
        (ROLE_PRO, 'Pro'),
        (ROLE_LITE, 'Lite'),
        (ROLE_USER, 'User'),
        (ROLE_ENTERPRISE, 'Enterprise'),
    ]
    CHAT_ACCESS_ROLES = [ROLE_PRO, ROLE_LITE, ROLE_ENTERPRISE]
    
    # Override last_name to allow NULL values for OAuth users
    last_name = models.CharField(max_length=150, blank=True, null=True)
    
    class_level = models.IntegerField(choices=CLASS_CHOICES, null=True, blank=True)
    fav_subjects = models.JSONField(default=list, blank=True)
    disliked_subjects = models.JSONField(default=list, blank=True)
    interests = models.JSONField(default=list, blank=True)  # User interests
    total_points = models.IntegerField(default=0)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_BAN)
    
    # Role fields
    is_student = models.BooleanField(default=True)  # Default role is student
    is_teacher = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_member = models.BooleanField(default=False)  # Member role for chat access
    is_banned = models.BooleanField(default=False)  # Ban status
    ban_reason = models.TextField(blank=True, null=True)  # Reason for ban
    
    # Google OAuth fields
    google_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    profile_picture = models.URLField(max_length=500, null=True, blank=True)
    
    # Study tracking fields
    total_study_time = models.PositiveIntegerField(default=0)  # Total minutes studied
    current_streak = models.PositiveIntegerField(default=0)    # Consecutive days studied
    longest_streak = models.PositiveIntegerField(default=0)   # Longest study streak
    
    # Quiz progress tracking
    static_question_status = models.CharField(
        max_length=20,
        choices=[('unfinished', 'Unfinished'), ('finished', 'Finished')],
        default='unfinished'
    )
    static_questions_completed = models.IntegerField(default=0)  # Count of static questions completed
    total_static_questions = models.IntegerField(default=0)  # Total static questions for user's class

    def has_ban_role(self):
        return self.role == self.ROLE_BAN

    def is_effectively_banned(self):
        return self.is_banned or self.has_ban_role()

    def has_chat_role_access(self):
        return self.role in self.CHAT_ACCESS_ROLES

    def can_access_chat(self):
        return not self.is_effectively_banned() and self.has_chat_role_access()
    
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

class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"
