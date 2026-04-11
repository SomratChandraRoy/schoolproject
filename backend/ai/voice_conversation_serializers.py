from rest_framework import serializers
from .voice_conversation_models import (
    VoiceConversationSession, VoiceConversationMessage,
    VoiceQuizSession, VoiceQuizQuestion, VoiceQuizAnswer, ConversationSummary
)


class VoiceConversationMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceConversationMessage
        fields = ['id', 'message_text', 'message_type', 'is_user_message', 
                 'audio_url', 'transcript', 'ai_response', 'confidence_score',
                 'is_correct', 'timestamp']


class VoiceConversationSessionSerializer(serializers.ModelSerializer):
    messages = VoiceConversationMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = VoiceConversationSession
        fields = ['id', 'session_id', 'mode', 'subject', 'topic', 'started_at',
                 'ended_at', 'is_active', 'conversation_summary', 'key_points',
                 'total_questions_asked', 'correct_answers', 'score_percentage',
                 'messages', 'created_at', 'updated_at']


class ConversationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ConversationSummary
        fields = ['id', 'summary_text', 'key_concepts', 'doubts_cleared',
                 'weak_concepts', 'strong_concepts', 'next_topics_to_study',
                 'learning_insights', 'study_recommendations',
                 'practice_questions_suggested', 'created_at', 'updated_at']


class VoiceQuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceQuizQuestion
        fields = ['id', 'question_number', 'question_text', 'question_type',
                 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option',
                 'correct_answer', 'explanation', 'question_audio_url', 'created_at']


class VoiceQuizAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceQuizAnswer
        fields = ['id', 'quiz_question', 'answer_text', 'answer_type', 'audio_url',
                 'transcript', 'is_correct', 'score_points', 'ai_evaluation',
                 'confidence_score', 'time_taken_seconds', 'answered_at']


class VoiceQuizSessionSerializer(serializers.ModelSerializer):
    questions = VoiceQuizQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = VoiceQuizSession
        fields = ['id', 'quiz_type', 'subject', 'topic', 'class_level', 'difficulty',
                 'total_questions', 'questions_answered', 'correct_answers', 'score_percentage',
                 'started_at', 'ended_at', 'time_spent_seconds', 'performance_analysis',
                 'weak_areas', 'strong_areas', 'is_completed', 'questions',
                 'created_at']
