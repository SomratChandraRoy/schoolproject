from django.db import models
from django.contrib.auth.models import User


class TranslationDictionary(models.Model):
    """
    Stores translations and definitions for English-Bangla pairs.
    Used for offline support and dictionary lookups.
    """
    
    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('bn', 'Bangla'),
    ]
    
    WORD_TYPE_CHOICES = [
        ('noun', 'Noun'),
        ('verb', 'Verb'),
        ('adjective', 'Adjective'),
        ('adverb', 'Adverb'),
        ('pronoun', 'Pronoun'),
        ('preposition', 'Preposition'),
        ('conjunction', 'Conjunction'),
        ('interjection', 'Interjection'),
        ('phrase', 'Phrase'),
    ]
    
    # Original word/phrase
    source_text = models.CharField(max_length=500, db_index=True)
    source_language = models.CharField(
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default='en'
    )
    
    # Translation
    target_text = models.CharField(max_length=500, db_index=True)
    target_language = models.CharField(
        max_length=2,
        choices=LANGUAGE_CHOICES,
        default='bn'
    )
    
    # Meaning/Definition
    meaning = models.TextField(max_length=1000, blank=True)
    
    # Word type
    word_type = models.CharField(
        max_length=20,
        choices=WORD_TYPE_CHOICES,
        blank=True
    )
    
    # Example sentences
    example_english = models.TextField(blank=True, max_length=500)
    example_bangla = models.TextField(blank=True, max_length=500)
    
    # Context/Usage
    context = models.CharField(
        max_length=100,
        blank=True,
        help_text="e.g., 'physics', 'literature', 'daily_use'"
    )
    
    # Difficulty level
    difficulty_level = models.IntegerField(
        default=1,
        choices=[(i, f'Level {i}') for i in range(1, 6)],
        help_text="1=Basic, 5=Advanced"
    )
    
    # Pronunciation
    pronunciation_english = models.CharField(max_length=200, blank=True)
    pronunciation_bangla = models.CharField(max_length=200, blank=True)
    
    # Usage counter (for popular terms)
    usage_count = models.IntegerField(default=0)
    
    # Metadata
    created_by = models.CharField(max_length=100, default='system')
    is_verified = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [
            ('source_text', 'source_language', 'target_language')
        ]
        indexes = [
            models.Index(fields=['source_text', 'source_language']),
            models.Index(fields=['target_text', 'target_language']),
            models.Index(fields=['word_type']),
            models.Index(fields=['context']),
        ]
        verbose_name_plural = 'Translation Dictionaries'
    
    def __str__(self):
        return f"{self.source_text} ({self.source_language}) → {self.target_text} ({self.target_language})"


class UserTranslationHistory(models.Model):
    """
    Stores user's translation history for personalization.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='translation_history')
    
    # Original text
    source_text = models.CharField(max_length=500)
    source_language = models.CharField(max_length=2, choices=[('en', 'English'), ('bn', 'Bangla')])
    
    # Translation result
    translated_text = models.CharField(max_length=500)
    target_language = models.CharField(max_length=2, choices=[('en', 'English'), ('bn', 'Bangla')])
    
    # Dictionary lookup if applicable
    dictionary_entry = models.ForeignKey(
        TranslationDictionary,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_history'
    )
    
    # Context
    context_type = models.CharField(
        max_length=50,
        default='general',
        help_text="e.g., 'study_session', 'notes', 'quiz_doubt'"
    )
    
    # Feedback
    is_helpful = models.BooleanField(null=True, blank=True)
    user_notes = models.TextField(blank=True, max_length=500)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['source_language', 'target_language']),
        ]
    
    def __str__(self):
        return f"{self.user.username}: {self.source_text[:30]} → {self.translated_text[:30]}"


class TranslatorSession(models.Model):
    """
    Stores translator sessions for offline sync.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='translator_sessions')
    
    # Session info
    session_id = models.CharField(max_length=100, unique=True)
    is_online = models.BooleanField(default=True)
    total_translations = models.IntegerField(default=0)
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    synced_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"{self.user.username} - Session {self.session_id[:8]} ({self.started_at})"


class DictionaryCategory(models.Model):
    """
    Categories for organizing dictionary entries.
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="emoji or icon name")
    color = models.CharField(max_length=7, blank=True, help_text="hex color code")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = 'Dictionary Categories'
    
    def __str__(self):
        return self.name
