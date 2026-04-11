from ai.ai_service import get_ai_service
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Subject, SyllabusTopic, StudyPlan, FlashcardDeck, Flashcard, FlashcardDeck, Flashcard
from .serializers import SubjectSerializer, SyllabusTopicSerializer, StudyPlanSerializer

class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subject.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        subjects = self.get_queryset()
        
        chart_data = []
        total_topics = 0
        total_completed = 0
        
        for subject in subjects:
            topics = subject.topics.all()
            subj_total = topics.count()
            subj_completed = topics.filter(status='completed').count()
            
            total_topics += subj_total
            total_completed += subj_completed
            
            chart_data.append({
                'name': subject.name,
                'progress': subject.progress_percentage,
                'color': subject.color_code,
                'total': subj_total,
                'completed': subj_completed
            })
            
        overall_progress = int((total_completed / total_topics) * 100) if total_topics > 0 else 0
        
        return Response({
            'overall_progress': overall_progress,
            'total_subjects': subjects.count(),
            'total_topics': total_topics,
            'completed_topics': total_completed,
            'chart_data': chart_data
        })

class SyllabusTopicViewSet(viewsets.ModelViewSet):
    serializer_class = SyllabusTopicSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SyllabusTopic.objects.filter(subject__user=self.request.user)

class StudyPlanViewSet(viewsets.ModelViewSet):
    serializer_class = StudyPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return StudyPlan.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def generate_plan(self, request):
        prompt_instruction = request.data.get('instruction', 'Generate a study plan')
        
        # Pull subjects
        subjects = Subject.objects.filter(user=request.user)
        subj_details = [f"{s.name} ({s.topics.count()} topics)" for s in subjects]
        subject_info = ", ".join(subj_details) if subj_details else "General subjects"

        prompt = f"""You are an expert AI teacher. Create a detailed study plan for the student.
Student Request: {prompt_instruction}
Student's Current Subjects: {subject_info}

Format your response in Markdown with clear headings and bullet points. Give actionable daily or weekly tasks."""

        ai_service = get_ai_service()
        success, response_text, error, source = ai_service.generate(prompt=prompt, feature_type='study_plan_provider')

        if not success:
            return Response({'error': error}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        plan = StudyPlan.objects.create(
            user=request.user,
            title=request.data.get('title', 'AI Generated Study Plan'),
            ai_prompt_used=prompt_instruction,
            plan_content=response_text
        )

        serializer = self.get_serializer(plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


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
