from rest_framework import serializers
from .models import Subject, SyllabusTopic, StudyPlan, FlashcardDeck, Flashcard

class SyllabusTopicSerializer(serializers.ModelSerializer):
    subject_name = serializers.ReadOnlyField(source='subject.name')

    class Meta:
        model = SyllabusTopic
        fields = [
            'id',
            'subject',
            'subject_name',
            'title',
            'description',
            'status',
            'is_important',
            'order_index',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ('created_at', 'updated_at')

    def validate_subject(self, value):
        request = self.context.get('request')
        if request and request.user.is_authenticated and value.user_id != request.user.id:
            raise serializers.ValidationError('You can only add topics to your own subjects.')
        return value


class BulkTopicCreateSerializer(serializers.Serializer):
    topics = serializers.ListField(
        child=serializers.CharField(max_length=255),
        allow_empty=False,
        required=True,
    )

    def validate_topics(self, value):
        cleaned_topics = []
        seen = set()

        for raw_topic in value:
            topic = raw_topic.strip()
            if not topic:
                continue

            normalized = topic.lower()
            if normalized in seen:
                continue

            seen.add(normalized)
            cleaned_topics.append(topic)

        if not cleaned_topics:
            raise serializers.ValidationError('Please provide at least one valid topic title.')

        return cleaned_topics

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
    pending_count = serializers.SerializerMethodField()
    unknown_count = serializers.SerializerMethodField()
    cards = FlashcardSerializer(many=True, read_only=True)

    class Meta:
        model = FlashcardDeck
        fields = [
            'id',
            'title',
            'description',
            'cards_count',
            'known_count',
            'pending_count',
            'unknown_count',
            'cards',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['user']

    def get_cards_count(self, obj):
        return obj.cards.count()

    def get_known_count(self, obj):
        return obj.cards.filter(review_status=Flashcard.STATUS_KNOWN).count()

    def get_pending_count(self, obj):
        return obj.cards.filter(review_status=Flashcard.STATUS_PENDING).count()

    def get_unknown_count(self, obj):
        return obj.cards.filter(review_status=Flashcard.STATUS_UNKNOWN).count()
