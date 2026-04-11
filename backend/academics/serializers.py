from rest_framework import serializers
from .models import Subject, SyllabusTopic, StudyPlan, FlashcardDeck, Flashcard

class SyllabusTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyllabusTopic
        fields = '__all__'

class SubjectSerializer(serializers.ModelSerializer):
    topics = SyllabusTopicSerializer(many=True, read_only=True)
    progress_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Subject
        fields = ['id', 'name', 'color_code', 'icon', 'progress_percentage', 'topics', 'created_at']
        read_only_fields = ('user',)

class StudyPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyPlan
        fields = '__all__'
        read_only_fields = ('user',)

class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = '__all__'

class FlashcardDeckSerializer(serializers.ModelSerializer):
    cards_count = serializers.SerializerMethodField()
    known_count = serializers.SerializerMethodField()
    cards = FlashcardSerializer(many=True, read_only=True)

    class Meta:
        model = FlashcardDeck
        fields = ['id', 'title', 'description', 'cards_count', 'known_count', 'cards', 'created_at', 'updated_at']
        read_only_fields = ['user']

    def get_cards_count(self, obj):
        return obj.cards.count()

    def get_known_count(self, obj):
        return obj.cards.filter(is_known=True).count()
