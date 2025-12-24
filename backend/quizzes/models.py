from django.db import models
from accounts.models import User


class Subject(models.Model):
    """Subject model to store class-specific subjects"""
    name = models.CharField(max_length=100)
    bengali_title = models.CharField(max_length=100, blank=True)
    subject_code = models.CharField(max_length=50)  # e.g., 'bangla_1st', 'physics'
    class_level = models.IntegerField(choices=[(i, f'Class {i}') for i in range(6, 13)])
    stream = models.CharField(max_length=50, blank=True, null=True)  # Science, Humanities, Business
    is_compulsory = models.BooleanField(default=True)
    icon = models.CharField(max_length=10, default='📚')
    color = models.CharField(max_length=50, default='bg-blue-100')
    description = models.TextField(blank=True)
    
    class Meta:
        ordering = ['class_level', 'name']
        unique_together = ['subject_code', 'class_level']
    
    def __str__(self):
        return f"{self.name} - Class {self.class_level}"


class Quiz(models.Model):
    SUBJECT_CHOICES = [
        ('physics', 'Physics'),
        ('chemistry', 'Chemistry'),
        ('math', 'Mathematics'),
        ('higher_math', 'Higher Mathematics'),
        ('bangla_1st', 'Bangla 1st Paper'),
        ('bangla_2nd', 'Bangla 2nd Paper'),
        ('english_1st', 'English 1st Paper'),
        ('english_2nd', 'English 2nd Paper'),
        ('biology', 'Biology'),
        ('ict', 'ICT'),
        ('science', 'Science'),
        ('bangladesh_global', 'Bangladesh & Global Studies'),
        ('history', 'History'),
        ('geography', 'Geography'),
        ('civics', 'Civics'),
        ('accounting', 'Accounting'),
        ('finance', 'Finance & Banking'),
        ('business', 'Business Entrepreneurship'),
        ('economics', 'Economics'),
        ('general_science', 'General Science'),
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
    question_type = models.CharField(max_length=10, choices=[('mcq', 'Multiple Choice'), ('short', 'Short Answer'), ('long', 'Long Answer')], default='mcq')
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
    
    class Meta:
        unique_together = ['user', 'subject']
        ordering = ['-last_updated']
    
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


class UserQuizProgress(models.Model):
    """Track user's progress through static and AI-generated questions"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=50, choices=Quiz.SUBJECT_CHOICES)
    class_level = models.IntegerField(choices=[(i, f'Class {i}') for i in range(6, 13)])
    
    # Static questions progress
    static_questions_completed = models.IntegerField(default=0)
    total_static_questions = models.IntegerField(default=0)
    static_completion_percentage = models.FloatField(default=0.0)
    
    # AI questions progress
    ai_questions_answered = models.IntegerField(default=0)
    ai_questions_correct = models.IntegerField(default=0)
    
    # Current difficulty level
    current_difficulty = models.CharField(
        max_length=10,
        choices=Quiz.DIFFICULTY_CHOICES,
        default='easy'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('static', 'Completing Static Questions'),
            ('ai_active', 'AI Questions Active'),
            ('finished', 'All Questions Finished')
        ],
        default='static'
    )
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['user', 'subject', 'class_level']
        ordering = ['-last_activity']
    
    def update_progress(self):
        """Update completion percentage and status"""
        if self.total_static_questions > 0:
            self.static_completion_percentage = (
                self.static_questions_completed / self.total_static_questions
            ) * 100
        
        # Check if 90% of static questions completed
        if self.static_completion_percentage >= 90 and self.status == 'static':
            self.status = 'ai_active'
        
        # Check if all static questions completed
        if self.static_questions_completed >= self.total_static_questions:
            self.status = 'finished'
            if not self.finished_at:
                from django.utils import timezone
                self.finished_at = timezone.now()
        
        self.save()
    
    def should_generate_ai_questions(self):
        """Check if AI should generate more questions"""
        return self.status == 'ai_active' or self.static_completion_percentage >= 90
    
    def __str__(self):
        return f"{self.user.username} - {self.subject} - {self.static_completion_percentage:.1f}% - {self.status}"


class AIGeneratedQuestion(models.Model):
    """Store AI-generated questions for users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=50, choices=Quiz.SUBJECT_CHOICES)
    class_level = models.IntegerField(choices=[(i, f'Class {i}') for i in range(6, 13)])
    difficulty = models.CharField(max_length=10, choices=Quiz.DIFFICULTY_CHOICES)
    
    question_text = models.TextField()
    question_type = models.CharField(
        max_length=10,
        choices=[('mcq', 'Multiple Choice'), ('short', 'Short Answer'), ('long', 'Long Answer')],
        default='mcq'
    )
    options = models.JSONField(default=dict)
    correct_answer = models.TextField()
    explanation = models.TextField(blank=True)
    
    # Status
    is_answered = models.BooleanField(default=False)
    user_answer = models.TextField(blank=True)
    is_correct = models.BooleanField(null=True, blank=True)
    
    # Generation info
    generated_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)
    generation_batch = models.IntegerField(default=1)  # Track which batch this question belongs to
    
    class Meta:
        ordering = ['generated_at']
        indexes = [
            models.Index(fields=['user', 'subject', 'is_answered']),
        ]
    
    def __str__(self):
        status = "Answered" if self.is_answered else "Pending"
        return f"{self.user.username} - {self.subject} - {status} - {self.question_text[:50]}..."