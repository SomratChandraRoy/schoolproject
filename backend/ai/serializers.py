from rest_framework import serializers
from .models import (
    AIChatSession, AIChatMessage, OfflineNote, RemedialExplanation, AIProviderSettings,
    VoiceConversationSession, VoiceConversationMessage, VoiceQuizSession, 
    VoiceQuizQuestion, VoiceQuizAnswer, ConversationSummary
)


class AIProviderSettingsSerializer(serializers.ModelSerializer):
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = AIProviderSettings
        fields = [
            'id',
            'provider',
            'provider_display',
            'ollama_base_url',
            'ollama_username',
            'ollama_password',
            'ollama_model',
            'updated_at',
            'updated_by',
            'updated_by_username'
        ]
        read_only_fields = ('id', 'updated_at', 'updated_by', 'provider_display', 'updated_by_username')
        extra_kwargs = {
            'ollama_password': {'write_only': True}  # Don't expose password in GET requests
        }


class AIChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIChatSession
        fields = '__all__'
        read_only_fields = ('user',)


class AIChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIChatMessage
        fields = '__all__'
        read_only_fields = ('session',)


class OfflineNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfflineNote
        fields = '__all__'
        read_only_fields = ('user',)


class RemedialExplanationSerializer(serializers.ModelSerializer):
    quiz_question = serializers.CharField(source='quiz.question_text', read_only=True)
    
    class Meta:
        model = RemedialExplanation
        fields = '__all__'
        read_only_fields = ('user',)


# Voice Conversation Serializers
class VoiceConversationMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceConversationMessage
        fields = '__all__'
        read_only_fields = ('session', 'created_at')


class ConversationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationSummary
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class VoiceConversationSessionSerializer(serializers.ModelSerializer):
    messages = VoiceConversationMessageSerializer(many=True, read_only=True)
    summary = ConversationSummarySerializer(read_only=True)
    
    class Meta:
        model = VoiceConversationSession
        fields = '__all__'
        read_only_fields = ('user', 'session_id', 'created_at', 'ended_at')


class VoiceQuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceQuizQuestion
        fields = '__all__'
        read_only_fields = ('quiz_session', 'created_at')


class VoiceQuizAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceQuizAnswer
        fields = '__all__'
        read_only_fields = ('question', 'created_at')


class VoiceQuizSessionSerializer(serializers.ModelSerializer):
    questions = VoiceQuizQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = VoiceQuizSession
        fields = '__all__'
        read_only_fields = ('user', 'quiz', 'created_at', 'ended_at')