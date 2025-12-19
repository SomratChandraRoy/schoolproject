from django.db import models
from accounts.models import User
from quizzes.models import Quiz


class AIChatSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Chat Session {self.session_id} - {self.user.username}"


class AIChatMessage(models.Model):
    SESSION_TYPE_CHOICES = [
        ('remedial', 'Remedial Learning'),
        ('note_taking', 'Note Taking'),
        ('general', 'General Chat'),
    ]
    
    session = models.ForeignKey(AIChatSession, on_delete=models.CASCADE, related_name='messages')
    message = models.TextField()
    is_user_message = models.BooleanField(default=True)  # True if from user, False if from AI
    message_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='general')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        sender = "User" if self.is_user_message else "AI"
        return f"{sender}: {self.message[:50]}..."


class OfflineNote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"


class RemedialExplanation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    explanation = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Remedial for {self.user.username} - {self.quiz.question_text[:50]}..."