"""API views for Bangla board-style Srijonshil quiz flow."""

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Quiz, SrijonshilAttempt, SrijonshilQuestionSet
from .serializers import SrijonshilAttemptSerializer, SrijonshilQuestionSetSerializer
from .srijonshil_service import get_srijonshil_generator


VALID_DIFFICULTIES = {choice[0] for choice in Quiz.DIFFICULTY_CHOICES}


def _normalize_answers(raw_answers, fallback_payload):
    if isinstance(raw_answers, list):
        values = [str(item or '').strip() for item in raw_answers[:4]]
    elif isinstance(raw_answers, dict):
        values = [
            str(
                raw_answers.get('1')
                or raw_answers.get('answer_1')
                or raw_answers.get('ক')
                or ''
            ).strip(),
            str(
                raw_answers.get('2')
                or raw_answers.get('answer_2')
                or raw_answers.get('খ')
                or ''
            ).strip(),
            str(
                raw_answers.get('3')
                or raw_answers.get('answer_3')
                or raw_answers.get('গ')
                or ''
            ).strip(),
            str(
                raw_answers.get('4')
                or raw_answers.get('answer_4')
                or raw_answers.get('ঘ')
                or ''
            ).strip(),
        ]
    else:
        values = [
            str(fallback_payload.get('answer_1') or '').strip(),
            str(fallback_payload.get('answer_2') or '').strip(),
            str(fallback_payload.get('answer_3') or '').strip(),
            str(fallback_payload.get('answer_4') or '').strip(),
        ]

    while len(values) < 4:
        values.append('')

    return values[:4]


class SrijonshilQuizStartView(APIView):
    """Create or reuse a Srijonshil question set (Uddipok + 4 parts)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        subject = str(request.data.get('subject') or '').strip()
        chapter = str(request.data.get('chapter') or '').strip()
        class_level = request.data.get('class_level', user.class_level)
        difficulty = str(request.data.get('difficulty') or 'medium').strip().lower()
        reuse_latest = bool(request.data.get('reuse_latest', True))

        if not subject:
            return Response({'error': 'subject is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not chapter:
            return Response({'error': 'chapter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            class_level_int = int(class_level)
        except (TypeError, ValueError):
            return Response(
                {'error': 'class_level must be an integer'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if class_level_int < 6 or class_level_int > 12:
            return Response(
                {'error': 'class_level must be between 6 and 12'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (user.is_admin or user.is_teacher):
            class_level_int = int(user.class_level or class_level_int)

        if difficulty not in VALID_DIFFICULTIES:
            difficulty = 'medium'

        if reuse_latest:
            existing = SrijonshilQuestionSet.objects.filter(
                user=user,
                subject=subject,
                class_level=class_level_int,
                chapter=chapter,
                is_submitted=False,
            ).order_by('-created_at').first()

            if existing:
                serializer = SrijonshilQuestionSetSerializer(existing)
                return Response(
                    {
                        'message': 'Existing question set loaded',
                        'source': 'cached',
                        'question_set': serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )

        generator = get_srijonshil_generator()
        success, payload, error, provider = generator.generate_question_payload(
            subject=subject,
            chapter=chapter,
            class_level=class_level_int,
            difficulty=difficulty,
        )

        questions = payload.get('questions') or []
        if len(questions) < 4:
            return Response(
                {'error': 'Could not generate a valid Srijonshil question set'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        question_set = SrijonshilQuestionSet.objects.create(
            user=user,
            subject=subject,
            class_level=class_level_int,
            chapter=chapter,
            difficulty=difficulty,
            uddipok=payload.get('uddipok', ''),
            question_1=questions[0].get('question', ''),
            question_2=questions[1].get('question', ''),
            question_3=questions[2].get('question', ''),
            question_4=questions[3].get('question', ''),
            model_answer_1=questions[0].get('model_answer', ''),
            model_answer_2=questions[1].get('model_answer', ''),
            model_answer_3=questions[2].get('model_answer', ''),
            model_answer_4=questions[3].get('model_answer', ''),
            provider_used=provider or payload.get('provider_used') or 'auto',
        )

        serializer = SrijonshilQuestionSetSerializer(question_set)

        response_body = {
            'message': 'Srijonshil question set ready',
            'source': 'ai' if success else 'fallback',
            'question_set': serializer.data,
        }

        if not success and error:
            response_body['generation_warning'] = error

        return Response(response_body, status=status.HTTP_201_CREATED)


class SrijonshilQuizSubmitView(APIView):
    """Submit four Srijonshil answers and return evaluated marks with feedback."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        question_set_id = request.data.get('question_set_id')

        if not question_set_id:
            return Response(
                {'error': 'question_set_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            question_set = SrijonshilQuestionSet.objects.get(id=question_set_id, user=user)
        except SrijonshilQuestionSet.DoesNotExist:
            return Response({'error': 'Question set not found'}, status=status.HTTP_404_NOT_FOUND)

        existing_attempt = SrijonshilAttempt.objects.filter(
            user=user,
            question_set=question_set,
        ).first()

        if existing_attempt:
            attempt_data = SrijonshilAttemptSerializer(existing_attempt).data
            return Response(
                {
                    'error': 'You already submitted this Srijonshil set',
                    'already_submitted': True,
                    'attempt': attempt_data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        answers = _normalize_answers(request.data.get('answers'), request.data)

        payload = {
            'uddipok': question_set.uddipok,
            'questions': [
                {'question': question_set.question_1, 'model_answer': question_set.model_answer_1},
                {'question': question_set.question_2, 'model_answer': question_set.model_answer_2},
                {'question': question_set.question_3, 'model_answer': question_set.model_answer_3},
                {'question': question_set.question_4, 'model_answer': question_set.model_answer_4},
            ],
        }

        generator = get_srijonshil_generator()
        evaluation, evaluation_source = generator.evaluate_answers(payload, answers)

        parts = evaluation.get('parts') or []
        if len(parts) < 4:
            return Response(
                {'error': 'Evaluation failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        attempt = SrijonshilAttempt.objects.create(
            user=user,
            question_set=question_set,
            answer_1=answers[0],
            answer_2=answers[1],
            answer_3=answers[2],
            answer_4=answers[3],
            feedback_1=parts[0].get('feedback', ''),
            feedback_2=parts[1].get('feedback', ''),
            feedback_3=parts[2].get('feedback', ''),
            feedback_4=parts[3].get('feedback', ''),
            overall_feedback=evaluation.get('overall_feedback', ''),
            marks_1=parts[0].get('marks', 0.0),
            marks_2=parts[1].get('marks', 0.0),
            marks_3=parts[2].get('marks', 0.0),
            marks_4=parts[3].get('marks', 0.0),
            total_marks=evaluation.get('total_marks', 0.0),
            evaluation_source=evaluation_source,
        )

        if not question_set.is_submitted:
            question_set.is_submitted = True
            question_set.save(update_fields=['is_submitted', 'updated_at'])

        try:
            earned_points = int(round(float(attempt.total_marks) * 5))
            if earned_points > 0:
                user.total_points += earned_points
                user.save(update_fields=['total_points'])
        except Exception:
            pass

        attempt_data = SrijonshilAttemptSerializer(attempt).data
        question_data = SrijonshilQuestionSetSerializer(
            question_set,
            context={'include_model_answers': True},
        ).data

        return Response(
            {
                'message': 'Srijonshil answer sheet evaluated',
                'attempt': attempt_data,
                'question_set': question_data,
                'evaluation': {
                    'parts': parts,
                    'total_marks': attempt.total_marks,
                    'overall_feedback': attempt.overall_feedback,
                    'source': evaluation_source,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class SrijonshilQuizHistoryView(APIView):
    """List generated Srijonshil sets with attempt summaries for current user."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        subject = str(request.query_params.get('subject') or '').strip()

        queryset = SrijonshilQuestionSet.objects.filter(user=user).order_by('-created_at')
        if subject:
            queryset = queryset.filter(subject=subject)

        queryset = queryset[:25]
        attempts = SrijonshilAttempt.objects.filter(
            user=user,
            question_set__in=queryset,
        ).select_related('question_set')

        attempts_map = {attempt.question_set_id: attempt for attempt in attempts}

        items = []
        for item in queryset:
            serialized = SrijonshilQuestionSetSerializer(item).data
            attempt = attempts_map.get(item.id)
            serialized['attempt_summary'] = (
                {
                    'attempt_id': attempt.id,
                    'total_marks': attempt.total_marks,
                    'submitted_at': attempt.submitted_at,
                    'evaluation_source': attempt.evaluation_source,
                }
                if attempt
                else None
            )
            items.append(serialized)

        return Response({'count': len(items), 'results': items})


class SrijonshilQuizDetailView(APIView):
    """Get one Srijonshil set (and attempt if submitted)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, set_id):
        user = request.user

        try:
            question_set = SrijonshilQuestionSet.objects.get(id=set_id, user=user)
        except SrijonshilQuestionSet.DoesNotExist:
            return Response({'error': 'Question set not found'}, status=status.HTTP_404_NOT_FOUND)

        include_answers = question_set.is_submitted or request.query_params.get('include_answers') == '1'
        set_data = SrijonshilQuestionSetSerializer(
            question_set,
            context={'include_model_answers': include_answers},
        ).data

        attempt = SrijonshilAttempt.objects.filter(
            user=user,
            question_set=question_set,
        ).first()

        attempt_data = SrijonshilAttemptSerializer(attempt).data if attempt else None

        return Response(
            {
                'question_set': set_data,
                'attempt': attempt_data,
            }
        )
