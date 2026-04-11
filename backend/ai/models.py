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
        ('ollama', 'Ollama (AWS)'),
        ('auto', 'Auto (Groq → Gemini fallback)'),
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