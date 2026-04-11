from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import AIChatSession, AIChatMessage, OfflineNote, RemedialExplanation, AIProviderSettings

@admin.register(AIProviderSettings)
class AIProviderSettingsAdmin(ModelAdmin):
    list_display = ('provider', 'updated_at', 'updated_by')
    fieldsets = (
        ('Global / Fallback Provider', {
            'fields': ('provider',)
        }),
        ('Feature-Specific Providers', {
            'fields': (
                'voice_ai_provider', 
                'study_plan_provider', 
                'quiz_flashcard_provider', 
                'doc_vision_provider', 
                'general_chat_provider'
            ),
            'description': 'Configure which specific AI model provider should run for which feature.'
        }),
        ('API Keys (Gemini, Groq, Alibaba)', {
            'fields': ('gemini_api_key', 'groq_api_key', 'alibaba_api_key'),
            'description': 'Keys here will override default application keys.'
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

@admin.register(AIChatSession)
class AIChatSessionAdmin(ModelAdmin):
    list_display = ('user', 'session_id', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'session_id')

@admin.register(AIChatMessage)
class AIChatMessageAdmin(ModelAdmin):
    list_display = ('session', 'message_type', 'is_user_message', 'timestamp')
    list_filter = ('message_type', 'is_user_message', 'timestamp')
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