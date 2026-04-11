import os

# Create Voice Conversation Models
models_code = '''
from django.db import models
from accounts.models import User
from quizzes.models import Quiz

class VoiceConversationSession(models.Model):
    SESSION_MODES = [
        ('tutor', 'AI Tutor (Ask Doubts)'),
        ('exam', 'Voice Exam Mode'),
        ('quiz', 'Voice Quiz/Practice'),
        ('general', 'General Chat'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='voice_sessions')
    session_id = models.CharField(max_length=100, unique=True)
    mode = models.CharField(max_length=20, choices=SESSION_MODES, default='tutor')
    subject = models.CharField(max_length=100, blank=True, null=True)
    topic = models.CharField(max_length=255, blank=True, null=True)
    
    # Conversation metadata
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    # Session summary
    conversation_summary = models.TextField(blank=True, null=True, 
                                           help_text="Auto-generated summary of the conversation")
    key_points = models.JSONField(default=list, blank=True,
                                 help_text="Key learning points from the conversation")
    
    # For quiz/exam mode
    total_questions_asked = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    score_percentage = models.FloatField(default=0.0)
    
    # Context from past sessions
    previous_session_context = models.TextField(blank=True, null=True,
                                               help_text="Summary from previous similar sessions for AI context")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Voice Session {self.session_id} ({self.get_mode_display()}) - {self.user.username}"


class VoiceConversationMessage(models.Model):
    MESSAGE_TYPES = [
        ('question', 'Question/Doubt'),
        ('answer', 'AI Answer'),
        ('quiz_question', 'Quiz Question'),
        ('quiz_answer', 'User Quiz Answer'),
        ('explanation', 'Explanation'),
        ('feedback', 'Feedback'),
    ]
    
    session = models.ForeignKey(VoiceConversationSession, on_delete=models.CASCADE, 
                               related_name='messages')
    
    # Message content
    message_text = models.TextField(help_text="Transcribed or typed message text")
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='question')
    is_user_message = models.BooleanField(default=True)
    
    # Voice recording metadata
    audio_url = models.URLField(blank=True, null=True, help_text="URL to audio file if recorded")
    transcript = models.TextField(blank=True, null=True, help_text="Transcription of voice message")
    
    # AI response with context
    ai_response = models.TextField(blank=True, null=True)
    confidence_score = models.FloatField(default=0.0, help_text="AI confidence in answer (0-1)")
    
    # Quiz-specific fields
    is_correct = models.BooleanField(null=True, blank=True, help_text="For quiz mode - was answer correct?")
    quiz_question_id = models.CharField(max_length=100, blank=True, null=True)
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        sender = "User" if self.is_user_message else "AI"
        return f"{sender}: {self.message_text[:50]}..."


class VoiceQuizSession(models.Model):
    QUIZ_TYPES = [
        ('practice', 'Practice Quiz'),
        ('exam', 'Exam Mode'),
        ('adaptive', 'Adaptive Quiz'),
        ('custom', 'Custom Topic Quiz'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='voice_quiz_sessions')
    conversation_session = models.OneToOneField(VoiceConversationSession, on_delete=models.SET_NULL,
                                               null=True, blank=True)
    
    quiz_type = models.CharField(max_length=20, choices=QUIZ_TYPES, default='practice')
    subject = models.CharField(max_length=100)
    topic = models.CharField(max_length=255, blank=True, null=True)
    class_level = models.IntegerField()
    difficulty = models.CharField(max_length=20, choices=[
        ('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')
    ], default='medium')
    
    # Quiz metadata
    total_questions = models.IntegerField(default=0)
    questions_answered = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    score_percentage = models.FloatField(default=0.0)
    
    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    time_spent_seconds = models.IntegerField(default=0)
    
    # Performance analysis
    performance_analysis = models.TextField(blank=True, null=True,
                                           help_text="AI's analysis of student performance")
    weak_areas = models.JSONField(default=list, blank=True,
                                 help_text="Topics where student struggled")
    strong_areas = models.JSONField(default=list, blank=True,
                                   help_text="Topics where student excelled")
    
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Voice Quiz - {self.user.username} ({self.get_quiz_type_display()})"


class VoiceQuizQuestion(models.Model):
    QUESTION_TYPES = [
        ('mcq', 'Multiple Choice'),
        ('short', 'Short Answer'),
        ('long', 'Long Answer'),
        ('calculation', 'Calculation/Problem'),
    ]
    
    quiz_session = models.ForeignKey(VoiceQuizSession, on_delete=models.CASCADE,
                                    related_name='questions')
    
    question_number = models.IntegerField(help_text="Sequence number in quiz")
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='mcq')
    
    # For MCQ
    option_a = models.TextField(blank=True, null=True)
    option_b = models.TextField(blank=True, null=True)
    option_c = models.TextField(blank=True, null=True)
    option_d = models.TextField(blank=True, null=True)
    correct_option = models.CharField(max_length=1, blank=True, null=True, 
                                     choices=[('A', 'A'), ('B', 'B'), ('C', 'C'), ('D', 'D')])
    
    # For other types
    correct_answer = models.TextField(blank=True, null=True, 
                                     help_text="Expected/model answer for evaluation")
    
    explanation = models.TextField(blank=True, null=True,
                                  help_text="Detailed explanation for the answer")
    
    question_audio_url = models.URLField(blank=True, null=True,
                                        help_text="Audio file of spoken question")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['question_number']
    
    def __str__(self):
        return f"Question {self.question_number}: {self.question_text[:50]}..."


class VoiceQuizAnswer(models.Model):
    quiz_question = models.ForeignKey(VoiceQuizQuestion, on_delete=models.CASCADE,
                                     related_name='answers')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # User's answer
    answer_text = models.TextField()
    answer_type = models.CharField(max_length=20, choices=[
        ('typed', 'Typed'),
        ('spoken', 'Voice Transcribed'),
        ('selected', 'Multiple Choice Selection'),
    ])
    
    # Audio and transcript
    audio_url = models.URLField(blank=True, null=True)
    transcript = models.TextField(blank=True, null=True, help_text="Transcription of voice answer")
    
    # Evaluation
    is_correct = models.BooleanField(default=False)
    score_points = models.FloatField(default=0.0)
    ai_evaluation = models.TextField(blank=True, null=True,
                                    help_text="AI's evaluation and feedback on answer")
    confidence_score = models.FloatField(default=0.0, help_text="AI confidence in evaluation (0-1)")
    
    # Timing
    time_taken_seconds = models.IntegerField(help_text="Time user spent on this question")
    answered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['answered_at']
        unique_together = ['quiz_question', 'user']
    
    def __str__(self):
        return f"Answer by {self.user.username} to Q{self.quiz_question.question_number}"


class ConversationSummary(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversation_summaries')
    voice_session = models.OneToOneField(VoiceConversationSession, on_delete=models.CASCADE,
                                         related_name='summary')
    
    # Summary details
    summary_text = models.TextField(help_text="AI-generated summary of the conversation")
    key_concepts = models.JSONField(default=list, help_text="Key concepts discussed")
    doubts_cleared = models.JSONField(default=list, help_text="Doubts/questions that were addressed")
    next_topics_to_study = models.JSONField(default=list, 
                                           help_text="AI recommendations for next topics")
    
    # Learning insights
    learning_insights = models.TextField(blank=True, null=True,
                                        help_text="Personalized insights about student's learning")
    weak_concepts = models.JSONField(default=list, help_text="Topics student struggled with")
    strong_concepts = models.JSONField(default=list, help_text="Topics student understood well")
    
    # Recommendations
    study_recommendations = models.TextField(blank=True, null=True,
                                            help_text="AI's recommendations for improvement")
    practice_questions_suggested = models.JSONField(default=list,
                                                    help_text="Practice questions to reinforce learning")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Summary for {self.user.username} - {self.created_at.strftime('%Y-%m-%d')}"
'''

with open("../../backend/ai/voice_conversation_models.py", "w", encoding="utf-8") as f:
    f.write(models_code)

print("Created voice_conversation_models.py")
