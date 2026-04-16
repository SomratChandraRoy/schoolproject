from django.db import models
from accounts.models import User
from quizzes.models import Quiz


class AIProviderSettings(models.Model):
    elevenlabs_api_key = models.CharField(max_length=255, blank=True, null=True, help_text='API Key for ElevenLabs Voice Synthesis (leave blank to use browser native voice)')
    """
    Global AI provider settings (singleton model)
    Allows admin to configure which AI provider to use
    """
    PROVIDER_CHOICES = [
        ('gemini', 'Google Gemini API'),
        ('groq', 'Groq API'),
        ('alibaba', 'Alibaba Cloud (Qwen)'),
        ('elevenlabs', 'ElevenLabs (voice-first; text with fallback)'),
        ('ollama', 'Ollama (AWS)'),
        ('auto', 'Auto (Groq → Gemini fallback)'),
    ]

    VOICE_STT_PROVIDER_CHOICES = [
        ('auto', 'Auto (Deepgram -> Sarvam fallback)'),
        ('deepgram', 'Deepgram'),
        ('sarvam', 'Sarvam AI'),
    ]

    VOICE_LLM_PROVIDER_CHOICES = [
        ('auto', 'Auto (Alibaba Qwen -> Groq fallback)'),
        ('alibaba', 'Alibaba Qwen'),
        ('groq', 'Groq'),
    ]

    VOICE_TTS_PROVIDER_CHOICES = [
        ('auto', 'Auto (Gemini TTS -> Sarvam fallback)'),
        ('gemini', 'Gemini TTS'),
        ('sarvam', 'Sarvam AI TTS'),
    ]

    # Global fallback provider
    provider = models.CharField(
        max_length=20,
        choices=PROVIDER_CHOICES,
        default='auto',
        help_text='Select which AI provider to use as the default/global fallback.'
    )

    # Feature-specific Providers
    voice_ai_provider = models.CharField(
        max_length=20, choices=PROVIDER_CHOICES, default='auto',
        help_text='AI Model Provider for AI Voice Tutor and Conversation.'
    )
    voice_stt_provider = models.CharField(
        max_length=20,
        choices=VOICE_STT_PROVIDER_CHOICES,
        default='auto',
        help_text='Speech-to-text provider for real-time AI voice tutor.',
    )
    voice_llm_provider = models.CharField(
        max_length=20,
        choices=VOICE_LLM_PROVIDER_CHOICES,
        default='auto',
        help_text='LLM provider for real-time AI voice tutor responses.',
    )
    voice_tts_provider = models.CharField(
        max_length=20,
        choices=VOICE_TTS_PROVIDER_CHOICES,
        default='auto',
        help_text='Text-to-speech provider for real-time AI voice tutor.',
    )
    study_plan_provider = models.CharField(
        max_length=20, choices=PROVIDER_CHOICES, default='auto',
        help_text='AI Model Provider for generating Study Plans and Suggestions.'
    )
    quiz_flashcard_provider = models.CharField(
        max_length=20, choices=PROVIDER_CHOICES, default='auto',
        help_text='AI Model Provider for generating Quizzes and Flashcards.'
    )
    doc_vision_provider = models.CharField(
        max_length=20, choices=PROVIDER_CHOICES, default='gemini',
        help_text='AI Model Provider for processing PDFs, Documents, and Images (Vision).'
    )
    general_chat_provider = models.CharField(
        max_length=20, choices=PROVIDER_CHOICES, default='auto',
        help_text='AI Model Provider for General Text Chat and Note taking.'
    )
    chat_page_provider = models.CharField(
        max_length=20,
        choices=PROVIDER_CHOICES,
        default='auto',
        help_text='AI Model Provider for the /chat page AI assistant with provider fallback.',
    )

    # API Keys Configuration
    gemini_api_key = models.CharField(
        max_length=255, 
        blank=True, null=True,
        help_text='Google Gemini API Key'
    )
    groq_api_key = models.CharField(
        max_length=255, 
        blank=True, null=True,
        help_text='Groq API Key'
    )
    alibaba_api_key = models.CharField(
        max_length=255, 
        blank=True, null=True,
        help_text='Alibaba Cloud DashScope API Key'
    )
    deepgram_api_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text='Deepgram API key for speech-to-text.',
    )
    sarvam_api_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text='Sarvam AI API key for STT/TTS fallback.',
    )
    flashcard_gemini_extra_keys = models.TextField(
        blank=True,
        null=True,
        help_text='Optional extra Gemini API keys for quiz/flashcard generation. Use comma or newline to separate multiple keys.',
    )
    flashcard_groq_extra_keys = models.TextField(
        blank=True,
        null=True,
        help_text='Optional extra Groq API keys for quiz/flashcard generation. Use comma or newline to separate multiple keys.',
    )
    flashcard_alibaba_extra_keys = models.TextField(
        blank=True,
        null=True,
        help_text='Optional extra Alibaba API keys for quiz/flashcard generation. Use comma or newline to separate multiple keys.',
    )
    # Ollama configuration
    ollama_base_url = models.CharField(
        max_length=255,
        default='http://51.21.208.44',
        help_text='Ollama server URL'
    )
    ollama_username = models.CharField(
        max_length=100,
        default='bipul',
        help_text='Ollama Basic Auth username'
    )
    ollama_password = models.CharField(
        max_length=255,
        default='Bipul$Ollama$Roy$2026$',
        help_text='Ollama Basic Auth password'
    )
    ollama_model = models.CharField(
        max_length=100,
        default='llama3',
        help_text='Ollama model name'
    )
    
    # Metadata
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ai_settings_updates'
    )
    
    class Meta:
        verbose_name = 'AI Provider Settings'
        verbose_name_plural = 'AI Provider Settings'
    
    def __str__(self):
        return f'AI Provider: {self.get_provider_display()}'
    
    @classmethod
    def get_settings(cls):
        """Get or create singleton settings"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists (singleton)
        self.pk = 1
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        # Prevent deletion of singleton
        pass


class ProviderSettings(AIProviderSettings):
    """
    Compatibility singleton alias used by the real-time voice tutor pipeline.
    Uses the same database table as AIProviderSettings.
    """

    class Meta:
        proxy = True
        verbose_name = 'Provider Settings'
        verbose_name_plural = 'Provider Settings'

    @classmethod
    def get_settings(cls):
        return AIProviderSettings.get_settings()


class UserProfile(models.Model):
    """Long-term learner profile for realtime voice tutoring."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='voice_profile')
    preferred_language = models.CharField(max_length=20, default='bn', help_text='Preferred tutoring language code.')
    profile_notes = models.TextField(blank=True, null=True)
    weak_areas = models.JSONField(default=list, blank=True)
    strong_areas = models.JSONField(default=list, blank=True)
    last_active_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Voice Profile - {self.user.username}"


class ConversationThread(models.Model):
    """Thread-level memory container for a user's real-time voice session."""

    THREAD_MODES = [
        ('tutor', 'Tutor'),
        ('exam', 'Exam'),
        ('quiz', 'Quiz'),
        ('general', 'General'),
    ]

    user_profile = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='threads')
    voice_session = models.OneToOneField(
        'VoiceConversationSession',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='thread',
    )
    thread_title = models.CharField(max_length=255, blank=True, null=True)
    subject = models.CharField(max_length=100, blank=True, null=True)
    topic = models.CharField(max_length=255, blank=True, null=True)
    mode = models.CharField(max_length=20, choices=THREAD_MODES, default='tutor')
    is_active = models.BooleanField(default=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(blank=True, null=True)
    last_summary_at = models.DateTimeField(blank=True, null=True)
    memory_snapshot = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"Thread {self.id} - {self.user_profile.user.username}"


class Message(models.Model):
    """Normalized thread messages used for memory summarization cadence."""

    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    ]

    thread = models.ForeignKey(ConversationThread, on_delete=models.CASCADE, related_name='messages')
    voice_message = models.OneToOneField(
        'VoiceConversationMessage',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='thread_message',
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    transcript = models.TextField(blank=True, null=True)
    provider_trace = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:40]}"


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
    provider_used = models.CharField(max_length=32, blank=True, default='')
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


# ========== VOICE CONVERSATION MODELS ==========

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
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
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
    thread = models.ForeignKey(
        ConversationThread,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='summaries',
    )
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