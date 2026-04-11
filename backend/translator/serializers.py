"""
Serializers for translator models.
"""

from rest_framework import serializers
from .models import TranslationDictionary, UserTranslationHistory, TranslatorSession


class TranslationDictionarySerializer(serializers.ModelSerializer):
    """
    Serializer for TranslationDictionary model.
    """
    
    class Meta:
        model = TranslationDictionary
        fields = [
            'id',
            'source_text',
            'source_language',
            'target_text',
            'target_language',
            'meaning',
            'word_type',
            'example_english',
            'example_bangla',
            'pronunciation_bangla',
            'context',
            'difficulty_level',
            'usage_count',
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']


class UserTranslationHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for UserTranslationHistory model.
    """
    dictionary_entry = TranslationDictionarySerializer(read_only=True)
    
    class Meta:
        model = UserTranslationHistory
        fields = [
            'id',
            'source_text',
            'source_language',
            'translated_text',
            'target_language',
            'dictionary_entry',
            'context_type',
            'is_helpful',
            'user_notes',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class TranslatorSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for TranslatorSession model.
    """
    
    class Meta:
        model = TranslatorSession
        fields = [
            'id',
            'session_id',
            'is_online',
            'total_translations',
            'started_at',
            'synced_at',
        ]
        read_only_fields = ['id', 'started_at']


class TranslateRequestSerializer(serializers.Serializer):
    """
    Serializer for translation request.
    """
    text = serializers.CharField(max_length=1000, required=True)
    source_language = serializers.ChoiceField(
        choices=['en', 'bn'],
        default='en'
    )
    target_language = serializers.ChoiceField(
        choices=['en', 'bn'],
        default='bn'
    )
    context_type = serializers.CharField(
        max_length=50,
        default='general',
        required=False
    )


class TranslateResponseSerializer(serializers.Serializer):
    """
    Serializer for translation response.
    """
    translated_text = serializers.CharField()
    source_text = serializers.CharField()
    source_language = serializers.CharField()
    target_language = serializers.CharField()
    is_offline = serializers.BooleanField()
    confidence = serializers.FloatField()
    alternatives = serializers.ListField(child=serializers.CharField())
    dictionary_entry = serializers.DictField(required=False)


class DictionaryLookupSerializer(serializers.Serializer):
    """
    Serializer for dictionary lookup.
    """
    text = serializers.CharField(max_length=500, required=True)
    language = serializers.ChoiceField(choices=['en', 'bn'], default='en')
    target_language = serializers.ChoiceField(choices=['en', 'bn'], default='bn')
