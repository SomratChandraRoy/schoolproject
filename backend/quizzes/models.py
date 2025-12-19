from django.db import models
from accounts.models import User


class Quiz(models.Model):
    SUBJECT_CHOICES = [
        ('physics', 'Physics'),
        ('chemistry', 'Chemistry'),
        ('math', 'General Math'),
        ('bangla', 'Bangla'),
        ('english', 'English'),
        ('biology', 'Biology'),
        ('ict', 'ICT'),
        ('general_knowledge', 'General Knowledge'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES)
    class_target = models.IntegerField(choices=[(i, f'Class {i}') for i in range(6, 13)])
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    question_text = models.TextField()
    options = models.JSONField(default=dict)  # Store options as JSON (for MCQ, short, long)
    correct_answer = models.TextField()
    explanation = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.subject} - Class {self.class_target} - {self.question_text[:50]}..."


class QuizAttempt(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    selected_answer = models.TextField()
    is_correct = models.BooleanField()
    attempted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.quiz.question_text[:30]}... - {'Correct' if self.is_correct else 'Incorrect'}"


class Analytics(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.IntegerField()
    mistakes = models.JSONField(default=dict)  # Store mistakes as JSON
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - Score: {self.score} - {self.timestamp}"


class UserPerformance(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=50)
    difficulty = models.CharField(max_length=10, choices=Quiz.DIFFICULTY_CHOICES, default='easy')
    elo_rating = models.IntegerField(default=1000)  # Starting Elo rating
    total_attempts = models.IntegerField(default=0)
    correct_attempts = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    def update_rating(self, score_percentage, opponent_rating=1000):
        """Update Elo rating based on performance"""
        # Calculate expected score
        expected = 1 / (1 + 10 ** ((opponent_rating - self.elo_rating) / 400))
        
        # Actual score (1 for win, 0 for loss, 0.5 for draw)
        actual = score_percentage / 100
        
        # Update rating (K-factor of 32)
        self.elo_rating = int(self.elo_rating + 32 * (actual - expected))
        
        # Ensure rating doesn't go below 100
        if self.elo_rating < 100:
            self.elo_rating = 100
    
    def update_difficulty(self):
        """Update difficulty level based on performance and Elo rating"""
        accuracy = 0
        if self.total_attempts > 0:
            accuracy = (self.correct_attempts / self.total_attempts) * 100
        
        # Promote to higher difficulty if accuracy > 80% and rating > 1200
        if accuracy > 80 and self.elo_rating > 1200:
            if self.difficulty == 'easy':
                self.difficulty = 'medium'
            elif self.difficulty == 'medium':
                self.difficulty = 'hard'
        
        # Demote to lower difficulty if accuracy < 50% and rating < 800
        elif accuracy < 50 and self.elo_rating < 800:
            if self.difficulty == 'hard':
                self.difficulty = 'medium'
            elif self.difficulty == 'medium':
                self.difficulty = 'easy'
    
    def __str__(self):
        return f"{self.user.username} - {self.subject} ({self.difficulty}) - Rating: {self.elo_rating}"