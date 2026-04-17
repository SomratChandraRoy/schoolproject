from rest_framework import serializers
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


class AIProviderSettingsSerializer(serializers.ModelSerializer):
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ProviderSettings
        fields = [
            'id',
            'provider',
            'voice_ai_provider',
            'voice_stt_provider',
            'voice_llm_provider',
            'voice_tts_provider',
            'voice_stt_provider_order',
            'voice_llm_provider_order',
            'voice_tts_provider_order',
            'voice_fast_mode',
            'voice_force_bangla',
            'voice_response_max_chars',
            'voice_stt_timeout_seconds',
            'voice_llm_timeout_seconds',
            'voice_tts_timeout_seconds',
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
            'study_plan_provider',
            'quiz_flashcard_provider',
            'doc_vision_provider',
            'general_chat_provider',
            'chat_page_provider',
            'provider_display',
            'gemini_api_key',
            'groq_api_key',
            'alibaba_api_key',
            'deepgram_api_key',
            'sarvam_api_key',
            'elevenlabs_api_key',
            'flashcard_gemini_extra_keys',
            'flashcard_groq_extra_keys',
            'flashcard_alibaba_extra_keys',
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
            'ollama_password': {'write_only': True},  # Don't expose password in GET requests
            'gemini_api_key': {'write_only': True},
            'groq_api_key': {'write_only': True},
            'alibaba_api_key': {'write_only': True},
            'deepgram_api_key': {'write_only': True},
            'sarvam_api_key': {'write_only': True},
            'elevenlabs_api_key': {'write_only': True},
            'flashcard_gemini_extra_keys': {'write_only': True},
            'flashcard_groq_extra_keys': {'write_only': True},
            'flashcard_alibaba_extra_keys': {'write_only': True},
        }


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class ConversationThreadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationThread
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'started_at')


class ThreadMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('created_at',)


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