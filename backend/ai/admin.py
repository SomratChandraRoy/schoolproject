from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import (
    AIChatSession,
    AIChatMessage,
    OfflineNote,
    RemedialExplanation,
    ProviderSettings,
    UserProfile,
    ConversationThread,
    Message,
)

@admin.register(ProviderSettings)
class ProviderSettingsAdmin(ModelAdmin):
    list_display = ('provider', 'updated_at', 'updated_by')
    fieldsets = (
        ('Global / Fallback Provider', {
            'fields': ('provider',)
        }),
        ('Feature-Specific Providers', {
            'fields': (
                'voice_ai_provider', 
                'voice_stt_provider',
                'voice_llm_provider',
                'voice_tts_provider',
                'study_plan_provider', 
                'quiz_flashcard_provider', 
                'doc_vision_provider', 
                'general_chat_provider',
                'chat_page_provider',
            ),
            'description': 'Configure which specific AI model provider should run for which feature.'
        }),
        ('API Keys (Gemini, Groq, Alibaba, Deepgram, Sarvam, ElevenLabs)', {
            'fields': (
                'gemini_api_key',
                'groq_api_key',
                'alibaba_api_key',
                'deepgram_api_key',
                'sarvam_api_key',
                'elevenlabs_api_key',
            ),
            'description': 'Keys here will override default application keys.'
        }),
        ('Extra API Keys for Quiz/Flashcards', {
            'fields': (
                'flashcard_gemini_extra_keys',
                'flashcard_groq_extra_keys',
                'flashcard_alibaba_extra_keys',
            ),
            'description': 'Optional backup keys (comma/newline separated) used only for quiz and flashcard generation.'
        }),
        ('Ollama Configuration', {
            'fields': ('ollama_base_url', 'ollama_username', 'ollama_password', 'ollama_model')
        }),
        ('Metadata', {
            'fields': ('updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('updated_at', 'updated_by')
    
    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(UserProfile)
class UserProfileAdmin(ModelAdmin):
    list_display = ('user', 'preferred_language', 'last_active_at', 'updated_at')
    list_filter = ('preferred_language', 'updated_at')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(ConversationThread)
class ConversationThreadAdmin(ModelAdmin):
    list_display = ('id', 'user_profile', 'mode', 'subject', 'is_active', 'last_summary_at', 'updated_at')
    list_filter = ('mode', 'is_active', 'updated_at')
    search_fields = ('user_profile__user__username', 'subject', 'topic', 'thread_title')
    readonly_fields = ('created_at', 'updated_at', 'started_at')


@admin.register(Message)
class ThreadMessageAdmin(ModelAdmin):
    list_display = ('id', 'thread', 'role', 'created_at')
    list_filter = ('role', 'created_at')
    search_fields = ('thread__user_profile__user__username', 'content')
    readonly_fields = ('created_at',)

@admin.register(AIChatSession)
class AIChatSessionAdmin(ModelAdmin):
    list_display = ('user', 'session_id', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'session_id')

@admin.register(AIChatMessage)
class AIChatMessageAdmin(ModelAdmin):
    list_display = ('session', 'message_type', 'is_user_message', 'provider_used', 'timestamp')
    list_filter = ('message_type', 'is_user_message', 'provider_used', 'timestamp')
    search_fields = ('session__user__username', 'message')

@admin.register(OfflineNote)
class OfflineNoteAdmin(ModelAdmin):
    list_display = ('user', 'title', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'title')

@admin.register(RemedialExplanation)
class RemedialExplanationAdmin(ModelAdmin):
    list_display = ('user', 'quiz', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'quiz__question_text')