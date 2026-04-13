import re

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
        """Keep options as object. Convert legacy list format back to keyed options."""
        representation = super().to_representation(instance)
        raw_options = representation.get('options')

        if isinstance(raw_options, dict):
            return representation

        if isinstance(raw_options, list):
            option_map = {}
            for idx, item in enumerate(raw_options):
                item_text = str(item or '').strip()
                if not item_text:
                    continue

                prefixed_match = re.match(r'^\s*([A-Da-d])\s*[\)\.\:\-]\s*(.+)$', item_text)
                if prefixed_match:
                    key = prefixed_match.group(1).upper()
                    value = prefixed_match.group(2).strip()
                else:
                    key = chr(ord('A') + idx)
                    value = item_text

                option_map[key] = value

            representation['options'] = option_map
            return representation

        representation['options'] = {}
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
