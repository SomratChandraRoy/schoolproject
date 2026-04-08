"""
AI Provider Settings Model
Allows admin to configure which AI provider to use
"""
from django.db import models


class AIProviderSettings(models.Model):
    """
    Global AI provider settings (singleton model)
    """
    PROVIDER_CHOICES = [
        ('gemini', 'Gemini API'),
        ('ollama', 'Ollama (AWS)'),
        ('auto', 'Auto (Groq → Gemini fallback)'),
    ]
    
    provider = models.CharField(
        max_length=20,
        choices=PROVIDER_CHOICES,
        default='auto',
        help_text='Select which AI provider to use for all AI features'
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
        'accounts.User',
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
