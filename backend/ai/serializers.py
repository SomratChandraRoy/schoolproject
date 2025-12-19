from rest_framework import serializers
from .models import AIChatSession, AIChatMessage, OfflineNote, RemedialExplanation


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