from ai.ai_service import get_ai_service
from django.db.models import Max
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .models import Subject, SyllabusTopic, StudyPlan, FlashcardDeck, Flashcard
from .serializers import SubjectSerializer, SyllabusTopicSerializer, StudyPlanSerializer, FlashcardDeckSerializer, FlashcardSerializer, BulkTopicCreateSerializer

class SubjectViewSet(viewsets.ModelViewSet):
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subject.objects.filter(user=self.request.user).prefetch_related('topics')

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

    @action(detail=True, methods=['post'])
    def bulk_add_topics(self, request, pk=None):
        subject = self.get_object()
        serializer = BulkTopicCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        input_topics = serializer.validated_data['topics']
        existing_titles = {
            title.strip().lower() for title in subject.topics.values_list('title', flat=True)
        }

        created_topics = []
        skipped_topics = []
        next_order_index = (subject.topics.aggregate(max_index=Max('order_index')).get('max_index') or 0) + 1

        for topic_title in input_topics:
            normalized = topic_title.lower()

            if normalized in existing_titles:
                skipped_topics.append(topic_title)
                continue

            created_topics.append(
                SyllabusTopic.objects.create(
                    subject=subject,
                    title=topic_title,
                    order_index=next_order_index,
                )
            )
            existing_titles.add(normalized)
            next_order_index += 1

        created_topics_data = SyllabusTopicSerializer(
            created_topics,
            many=True,
            context={'request': request},
        ).data

        return Response(
            {
                'created_count': len(created_topics_data),
                'skipped_count': len(skipped_topics),
                'created_topics': created_topics_data,
                'skipped_topics': skipped_topics,
            },
            status=status.HTTP_201_CREATED if created_topics_data else status.HTTP_200_OK,
        )

class SyllabusTopicViewSet(viewsets.ModelViewSet):
    serializer_class = SyllabusTopicSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SyllabusTopic.objects.filter(subject__user=self.request.user).select_related('subject')

    def perform_create(self, serializer):
        subject = serializer.validated_data['subject']
        if subject.user_id != self.request.user.id:
            raise PermissionDenied('You can only add topics to your own subjects.')

        if 'order_index' in serializer.validated_data:
            serializer.save()
            return

        next_order_index = (subject.topics.aggregate(max_index=Max('order_index')).get('max_index') or 0) + 1
        serializer.save(order_index=next_order_index)

    def perform_update(self, serializer):
        subject = serializer.validated_data.get('subject', serializer.instance.subject)
        if subject.user_id != self.request.user.id:
            raise PermissionDenied('You can only move topics into your own subjects.')

        serializer.save()

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
        instruction = (request.data.get('instruction') or '').strip()
        raw_count = request.data.get('count', 20)

        try:
            requested_count = int(raw_count)
        except (TypeError, ValueError):
            return Response({'error': 'count must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        if requested_count < 1:
            return Response({'error': 'count must be at least 1'}, status=status.HTTP_400_BAD_REQUEST)

        requested_count = min(requested_count, 20)

        if not instruction:
            return Response({'error': 'instruction is required'}, status=status.HTTP_400_BAD_REQUEST)

        user_class = getattr(request.user, 'class_level', None)
        class_info = f"Class {user_class}" if user_class else "Class 6-12"

        existing_fronts = list(deck.cards.values_list('front', flat=True))
        existing_fronts_text = '\n'.join(f"- {front}" for front in existing_fronts[:120]) if existing_fronts else '- (none)'
        
        prompt = f"""তুমি একজন বাংলা শিক্ষকের সহকারী। বিষয়: {instruction}
শিক্ষার্থীর শ্রেণি: {class_info}

নিয়ম:
- ঠিক {requested_count}টি ফ্ল্যাশকার্ড তৈরি করো।
- সব প্রশ্ন এবং উত্তর বাংলায় লিখবে।
- প্রশ্নগুলো ছোট, পরিষ্কার, শিশু-বান্ধব এবং শেখার উপযোগী হবে।
- প্রশ্ন ও উত্তরের কঠিনতা {class_info} শিক্ষার্থীর উপযোগী হবে।
- উত্তরগুলো সহজ ভাষায়, ১-৩ বাক্যে লিখবে।
- একই প্রশ্ন পুনরাবৃত্তি করবে না।
- নিচের বিদ্যমান প্রশ্নগুলোর সাথে মিল আছে এমন প্রশ্ন আর দেবে না:
{existing_fronts_text}

শুধু JSON array দেবে। অন্য কোন লেখা নয়।
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

            if isinstance(cards_data, dict) and isinstance(cards_data.get('cards'), list):
                cards_data = cards_data.get('cards')

            if not isinstance(cards_data, list):
                return Response({'error': 'AI output was not a list of flashcards'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            created_count = 0
            seen_fronts = {front.strip().lower() for front in existing_fronts}
                
            for card in cards_data[:requested_count]:
                if not isinstance(card, dict):
                    continue

                front = str(card.get('front', '')).strip()
                back = str(card.get('back', '')).strip()
                if not front or not back:
                    continue

                normalized_front = front.lower()
                if normalized_front in seen_fronts:
                    continue

                Flashcard.objects.create(
                    deck=deck,
                    front=front,
                    back=back,
                    is_known=False,
                    review_status=Flashcard.STATUS_UNKNOWN,
                )
                seen_fronts.add(normalized_front)
                created_count += 1

            if created_count == 0:
                return Response(
                    {'error': 'No valid new flashcards were generated. Please try again.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            
            # Refresh from DB
            deck = self.get_object()
            serializer = self.get_serializer(deck)
            return Response(
                {
                    'deck': serializer.data,
                    'created_count': created_count,
                    'requested_count': requested_count,
                    'class_level': user_class,
                },
                status=status.HTTP_201_CREATED,
            )
            
        except Exception as e:
            return Response({'error': f'Failed to parse AI output: {str(e)}', 'raw_output': response_text}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path=r'cards/(?P<card_id>\d+)/toggle')
    def toggle_card(self, request, pk=None, card_id=None):
        deck = self.get_object()
        try:
            card = deck.cards.get(id=card_id)
            card.is_known = not card.is_known
            card.review_status = Flashcard.STATUS_KNOWN if card.is_known else Flashcard.STATUS_UNKNOWN
            card.save(update_fields=['is_known', 'review_status'])
            return Response({'status': 'toggled', 'is_known': card.is_known, 'review_status': card.review_status})
        except Flashcard.DoesNotExist:
            return Response({'error': 'Card not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path=r'cards/(?P<card_id>\d+)/set_status')
    def set_card_status(self, request, pk=None, card_id=None):
        deck = self.get_object()
        try:
            card = deck.cards.get(id=card_id)
        except Flashcard.DoesNotExist:
            return Response({'error': 'Card not found'}, status=status.HTTP_404_NOT_FOUND)

        status_value = (request.data.get('status') or '').strip().lower()
        allowed_statuses = {
            Flashcard.STATUS_KNOWN,
            Flashcard.STATUS_PENDING,
            Flashcard.STATUS_UNKNOWN,
        }

        if status_value not in allowed_statuses:
            return Response(
                {
                    'error': 'Invalid status',
                    'allowed': sorted(list(allowed_statuses)),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        card.review_status = status_value
        card.is_known = status_value == Flashcard.STATUS_KNOWN
        card.save(update_fields=['review_status', 'is_known'])

        return Response(
            {
                'status': 'updated',
                'review_status': card.review_status,
                'is_known': card.is_known,
            }
        )
