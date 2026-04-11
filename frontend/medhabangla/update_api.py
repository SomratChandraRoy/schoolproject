import os

def append_to_file(path, code):
    with open(path, "a", encoding="utf-8") as f:
        f.write(code)

def replace_in_file(path, old, new):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)

# Update serializers
serializers_path = "../../backend/academics/serializers.py"
append_to_file(serializers_path, '''
from .models import FlashcardDeck, Flashcard

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
''')

# Update views
views_path = "../../backend/academics/views.py"
replace_in_file(views_path, 
    "from .models import Subject, SyllabusTopic, StudyPlan",
    "from .models import Subject, SyllabusTopic, StudyPlan, FlashcardDeck, Flashcard"
)
replace_in_file(views_path,
    ", SyllabusTopicSerializer,\nStudyPlanSerializer",
    ", SyllabusTopicSerializer, StudyPlanSerializer, FlashcardDeckSerializer, FlashcardSerializer"
)

append_to_file(views_path, '''

class FlashcardDeckViewSet(viewsets.ModelViewSet):
    serializer_class = FlashcardDeckSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FlashcardDeck.objects.filter(user=self.request.user).prefetch_related('cards')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def generate_cards(self, request, pk=None):
        deck = self.get_object()
        instruction = request.data.get('instruction', 'Generate study flashcards')
        
        prompt = f"""You are a helpful AI tutor. Create exactly 5 flashcards for: {instruction}.
Respond in strict JSON format:
[
  {{"front": "Question 1?", "back": "Answer 1"}},
  {{"front": "Question 2?", "back": "Answer 2"}}
]
"""
        from ai.ai_service import get_ai_service
        import json
        import re
        
        ai_service = get_ai_service()
        success, response_text, error, source = ai_service.generate(prompt=prompt, feature_type='quiz_flashcard_provider')

        if not success:
            return Response({'error': error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            # Extract JSON block
            json_match = re.search(r'\[\s*\{.*?\}\s*\]', response_text, re.DOTALL)
            if json_match:
                cards_data = json.loads(json_match.group(0))
            else:
                cards_data = json.loads(response_text)
                
            for card in cards_data:
                Flashcard.objects.create(
                    deck=deck,
                    front=card.get('front', 'Q?'),
                    back=card.get('back', 'A')
                )
            
            # Refresh from DB
            deck = self.get_object()
            serializer = self.get_serializer(deck)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': f'Failed to parse AI output: {str(e)}', 'raw_output': response_text}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='cards/(?P<card_id>\d+)/toggle')
    def toggle_card(self, request, pk=None, card_id=None):
        deck = self.get_object()
        try:
            card = deck.cards.get(id=card_id)
            card.is_known = not card.is_known
            card.save()
            return Response({'status': 'toggled', 'is_known': card.is_known})
        except Flashcard.DoesNotExist:
            return Response({'error': 'Card not found'}, status=status.HTTP_404_NOT_FOUND)
''')

# Update urls
urls_path = "../../backend/academics/urls.py"
replace_in_file(urls_path, 
    "from .views import SubjectViewSet, SyllabusTopicViewSet, StudyPlanViewSet",
    "from .views import SubjectViewSet, SyllabusTopicViewSet, StudyPlanViewSet, FlashcardDeckViewSet"
)
replace_in_file(urls_path,
    "router.register(r'study-plans', StudyPlanViewSet, basename='studyplan')",
    "router.register(r'study-plans', StudyPlanViewSet, basename='studyplan')\nrouter.register(r'flashcards', FlashcardDeckViewSet, basename='flashcarddeck')"
)

print("Updated serializers, views, and urls.")
