from django.contrib import admin
from .models import AIChatSession, AIChatMessage, OfflineNote, RemedialExplanation

@admin.register(AIChatSession)
class AIChatSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'session_id', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'session_id')

@admin.register(AIChatMessage)
class AIChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'message_type', 'is_user_message', 'timestamp')
    list_filter = ('message_type', 'is_user_message', 'timestamp')
    search_fields = ('session__user__username', 'message')

@admin.register(OfflineNote)
class OfflineNoteAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'title')

@admin.register(RemedialExplanation)
class RemedialExplanationAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'quiz__question_text')