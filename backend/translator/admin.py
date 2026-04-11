"""
Django Admin configuration for translator models
"""

from django.contrib import admin
from .models import (
    TranslationDictionary,
    UserTranslationHistory,
    TranslatorSession,
    DictionaryCategory,
)


@admin.register(TranslationDictionary)
class TranslationDictionaryAdmin(admin.ModelAdmin):
    """Admin for TranslationDictionary"""
    
    list_display = [
        'source_text',
        'target_text',
        'word_type',
        'difficulty_level',
        'usage_count',
        'is_verified',
    ]
    list_filter = [
        'source_language',
        'target_language',
        'word_type',
        'difficulty_level',
        'is_verified',
        'created_at',
    ]
    search_fields = [
        'source_text',
        'target_text',
        'meaning',
    ]
    readonly_fields = [
        'usage_count',
        'created_at',
        'updated_at',
    ]
    fieldsets = (
        ('Translation', {
            'fields': (
                'source_text',
                'source_language',
                'target_text',
                'target_language',
            )
        }),
        ('Details', {
            'fields': (
                'meaning',
                'word_type',
                'context',
                'difficulty_level',
            )
        }),
        ('Examples & Pronunciation', {
            'fields': (
                'example_english',
                'example_bangla',
                'pronunciation_english',
                'pronunciation_bangla',
            )
        }),
        ('Metadata', {
            'fields': (
                'usage_count',
                'is_verified',
                'created_by',
                'created_at',
                'updated_at',
            )
        }),
    )


@admin.register(UserTranslationHistory)
class UserTranslationHistoryAdmin(admin.ModelAdmin):
    """Admin for UserTranslationHistory"""
    
    list_display = [
        'user',
        'source_text',
        'translated_text',
        'source_language',
        'target_language',
        'is_helpful',
        'created_at',
    ]
    list_filter = [
        'source_language',
        'target_language',
        'is_helpful',
        'created_at',
    ]
    search_fields = [
        'user__username',
        'source_text',
        'translated_text',
    ]
    readonly_fields = [
        'created_at',
    ]


@admin.register(TranslatorSession)
class TranslatorSessionAdmin(admin.ModelAdmin):
    """Admin for TranslatorSession"""
    
    list_display = [
        'user',
        'session_id',
        'is_online',
        'total_translations',
        'started_at',
        'synced_at',
    ]
    list_filter = [
        'is_online',
        'started_at',
    ]
    search_fields = [
        'user__username',
        'session_id',
    ]
    readonly_fields = [
        'session_id',
        'started_at',
    ]


@admin.register(DictionaryCategory)
class DictionaryCategoryAdmin(admin.ModelAdmin):
    """Admin for DictionaryCategory"""
    
    list_display = [
        'name',
        'description',
        'icon',
        'color',
    ]
    search_fields = [
        'name',
    ]
