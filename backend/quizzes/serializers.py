from rest_framework import serializers
from .models import Quiz, QuizAttempt, Analytics, Subject


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'bengali_title', 'subject_code', 'class_level', 
                  'stream', 'is_compulsory', 'icon', 'color', 'description']


class QuizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quiz
        fields = ['id', 'subject', 'class_target', 'difficulty', 'question_text', 
                  'question_type', 'options', 'correct_answer', 'explanation', 
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
    
    def to_representation(self, instance):
        """Convert options dict to array for frontend compatibility"""
        representation = super().to_representation(instance)
        
        # Convert options from dict to array
        # If options is a dict like {'A': 'option1', 'B': 'option2'}
        # Convert to array like ['A) option1', 'B) option2']
        if isinstance(representation['options'], dict) and representation['options']:
            options_array = []
            for key, value in representation['options'].items():
                options_array.append(f"{key}) {value}")
            representation['options'] = options_array
        elif not representation['options']:
            # If options is empty dict or None, set to empty array
            representation['options'] = []
        
        return representation


class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz = QuizSerializer(read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = ['id', 'user', 'quiz', 'selected_answer', 'is_correct', 'attempted_at']
        read_only_fields = ['attempted_at']


class AnalyticsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analytics
        fields = ['id', 'user', 'score', 'mistakes', 'timestamp']
        read_only_fields = ['timestamp']
