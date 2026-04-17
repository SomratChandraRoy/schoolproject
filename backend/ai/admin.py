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
    VoiceConversationSession,
    VoiceConversationMessage,
    VoiceQuizSession,
    VoiceQuizQuestion,
    VoiceQuizAnswer,
    ConversationSummary,
)

@admin.register(ProviderSettings)
class ProviderSettingsAdmin(ModelAdmin):
    list_display = (
        'provider',
        'voice_stt_provider',
        'voice_llm_provider',
        'voice_tts_provider',
        'voice_fast_mode',
        'updated_at',
        'updated_by',
    )
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
        ('Voice Runtime Controls', {
            'fields': (
                'voice_stt_provider_order',
                'voice_llm_provider_order',
                'voice_tts_provider_order',
                'voice_fast_mode',
                'voice_force_bangla',
                'voice_response_max_chars',
                'voice_stt_timeout_seconds',
                'voice_llm_timeout_seconds',
                'voice_tts_timeout_seconds',
            ),
            'description': 'Fine-tune voice speed, fallback order, and timeout behavior for realtime calls.'
        }),
        ('Voice API Endpoints & Model Configuration', {
            'fields': (
                'deepgram_stt_url',
                'deepgram_stt_language',
                'deepgram_stt_model',
                'deepgram_stt_tier',
                'sarvam_stt_url',
                'sarvam_stt_language',
                'sarvam_tts_url',
                'sarvam_tts_language',
                'sarvam_tts_speaker',
                'gemini_tts_url',
                'gemini_tts_voice',
            ),
            'description': 'Complete API-level customization for Bangla voice STT/LLM/TTS orchestration.'
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


@admin.register(VoiceConversationSession)
class VoiceConversationSessionAdmin(ModelAdmin):
    list_display = (
        'session_id',
        'user',
        'mode',
        'subject',
        'is_active',
        'started_at',
        'ended_at',
        'total_questions_asked',
    )
    list_filter = ('mode', 'is_active', 'started_at', 'ended_at')
    search_fields = ('session_id', 'user__username', 'user__email', 'subject', 'topic')
    readonly_fields = ('session_id', 'started_at', 'ended_at', 'created_at', 'updated_at')


@admin.register(VoiceConversationMessage)
class VoiceConversationMessageAdmin(ModelAdmin):
    list_display = ('id', 'session', 'message_type', 'is_user_message', 'confidence_score', 'timestamp')
    list_filter = ('message_type', 'is_user_message', 'timestamp')
    search_fields = ('session__session_id', 'session__user__username', 'message_text', 'transcript', 'ai_response')
    readonly_fields = ('timestamp',)


@admin.register(VoiceQuizSession)
class VoiceQuizSessionAdmin(ModelAdmin):
    list_display = (
        'id',
        'user',
        'quiz_type',
        'subject',
        'difficulty',
        'questions_answered',
        'correct_answers',
        'score_percentage',
        'is_completed',
        'started_at',
    )
    list_filter = ('quiz_type', 'difficulty', 'is_completed', 'started_at')
    search_fields = ('user__username', 'subject', 'topic')
    readonly_fields = ('started_at', 'ended_at', 'created_at', 'updated_at')


@admin.register(VoiceQuizQuestion)
class VoiceQuizQuestionAdmin(ModelAdmin):
    list_display = ('quiz_session', 'question_number', 'question_type', 'correct_option', 'created_at')
    list_filter = ('question_type', 'created_at')
    search_fields = ('quiz_session__user__username', 'question_text', 'correct_answer')
    readonly_fields = ('created_at',)


@admin.register(VoiceQuizAnswer)
class VoiceQuizAnswerAdmin(ModelAdmin):
    list_display = ('quiz_question', 'user', 'answer_type', 'is_correct', 'score_points', 'answered_at')
    list_filter = ('answer_type', 'is_correct', 'answered_at')
    search_fields = ('user__username', 'answer_text', 'transcript', 'ai_evaluation')
    readonly_fields = ('answered_at',)


@admin.register(ConversationSummary)
class ConversationSummaryAdmin(ModelAdmin):
    list_display = ('id', 'user', 'voice_session', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'summary_text')
    readonly_fields = ('created_at', 'updated_at')

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