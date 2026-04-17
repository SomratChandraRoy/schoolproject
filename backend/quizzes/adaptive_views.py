"""
Adaptive Quiz Views
Handles adaptive quiz flow with static questions and AI-generated questions
"""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count, Q
from threading import Thread

from .models import Quiz, QuizAttempt, UserQuizProgress, AIGeneratedQuestion
from .serializers import QuizSerializer
from .evaluation import evaluate_quiz_answer, format_answer_for_display
from .leveling import get_level_info
from accounts.models import User


VALID_QUESTION_TYPES = {'mcq', 'short', 'long'}


def parse_question_types(raw_types, fallback='mcq'):
    if isinstance(raw_types, list):
        candidates = raw_types
    elif isinstance(raw_types, str):
        candidates = raw_types.split(',')
    elif raw_types is None:
        candidates = [fallback]
    else:
        candidates = [str(raw_types)]

    normalized = []
    seen = set()
    for raw_value in candidates:
        question_type = str(raw_value or '').strip().lower()
        if question_type in VALID_QUESTION_TYPES and question_type not in seen:
            normalized.append(question_type)
            seen.add(question_type)

    return normalized or [fallback]


def pick_next_type(available_counts, served_counts, selected_types):
    candidate_types = [
        question_type
        for question_type in selected_types
        if available_counts.get(question_type, 0) > 0
    ]

    if not candidate_types:
        return None

    candidate_types.sort(
        key=lambda question_type: (
            served_counts.get(question_type, 0),
            selected_types.index(question_type),
        )
    )
    return candidate_types[0]


class AdaptiveQuizStartView(APIView):
    """Initialize or continue adaptive quiz session"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        subject = request.data.get('subject')
        class_level = request.data.get('class_level', user.class_level)
        question_types = request.data.get(
            'question_types',
            request.data.get('question_type', 'mcq')
        )
        selected_types = parse_question_types(question_types)

        try:
            class_level_int = int(class_level)
        except (TypeError, ValueError):
            return Response(
                {'error': 'class_level must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not subject or not class_level:
            return Response(
                {'error': 'Subject and class_level are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(
            f"[AdaptiveQuiz] Starting quiz for {user.username}: {subject}, "
            f"Class {class_level_int}, Types {selected_types}"
        )
        
        # Get or create progress tracker
        progress, created = UserQuizProgress.objects.get_or_create(
            user=user,
            subject=subject,
            class_level=class_level_int
        )
        
        # Count total static questions for this subject/class
        if created or progress.total_static_questions == 0:
            total_static = Quiz.objects.filter(
                subject=subject,
                class_target=class_level_int
            ).count()
            progress.total_static_questions = total_static
            progress.save()
            print(f"[AdaptiveQuiz] Total static questions: {total_static}")
        
        # Update progress
        progress.update_progress()

        level_info = get_level_info(
            user=user,
            subject=subject,
            class_level=class_level_int,
        )
        generation_difficulty = level_info['recommended_difficulty']
        if progress.current_difficulty != generation_difficulty:
            progress.current_difficulty = generation_difficulty
            progress.save(update_fields=['current_difficulty', 'last_activity'])
            level_info = get_level_info(
                user=user,
                subject=subject,
                class_level=class_level_int,
            )
        
        return Response({
            'progress': {
                'status': progress.status,
                'static_completed': progress.static_questions_completed,
                'total_static': progress.total_static_questions,
                'completion_percentage': progress.static_completion_percentage,
                'current_difficulty': progress.current_difficulty,
                'ai_questions_answered': progress.ai_questions_answered,
                'ai_questions_correct': progress.ai_questions_correct
            },
            'selected_question_types': selected_types,
            'message': 'Quiz session initialized',
            'level_info': level_info,
        })


class AdaptiveQuizNextQuestionView(APIView):
    """Get the next question (static or AI-generated)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        subject = request.data.get('subject')
        class_level = request.data.get('class_level', user.class_level)
        question_types = request.data.get(
            'question_types',
            request.data.get('question_type', 'mcq')
        )
        selected_types = parse_question_types(question_types)

        try:
            class_level_int = int(class_level)
        except (TypeError, ValueError):
            return Response(
                {'error': 'class_level must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not subject or not class_level:
            return Response(
                {'error': 'Subject and class_level are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get progress
        progress = UserQuizProgress.objects.filter(
            user=user,
            subject=subject,
            class_level=class_level_int
        ).first()
        
        if not progress:
            return Response(
                {'error': 'Quiz session not initialized. Call /start first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        level_info = get_level_info(
            user=user,
            subject=subject,
            class_level=class_level_int,
        )
        generation_difficulty = level_info['recommended_difficulty']
        if progress.current_difficulty != generation_difficulty:
            progress.current_difficulty = generation_difficulty
            progress.save(update_fields=['current_difficulty', 'last_activity'])
            level_info = get_level_info(
                user=user,
                subject=subject,
                class_level=class_level_int,
            )
        
        print(f"[AdaptiveQuiz] Getting next question for {user.username}")
        print(f"[AdaptiveQuiz] Progress status: {progress.status}, Completion: {progress.static_completion_percentage:.1f}%")
        print(f"[AdaptiveQuiz] Selected types: {selected_types}")
        
        # Determine question source based on progress
        if progress.status == 'static' or progress.static_completion_percentage < 90:
            # Get static question that user hasn't answered yet and rotate across selected types.
            answered_ids = QuizAttempt.objects.filter(
                user=user
            ).values_list('quiz_id', flat=True).distinct()

            static_queryset = Quiz.objects.filter(
                subject=subject,
                class_target=class_level_int,
                question_type__in=selected_types
            ).exclude(id__in=answered_ids)

            available_static_counts = {
                row['question_type']: row['total']
                for row in static_queryset.values('question_type').annotate(total=Count('id'))
            }
            served_static_counts = {
                row['quiz__question_type']: row['total']
                for row in QuizAttempt.objects.filter(
                    user=user,
                    quiz__subject=subject,
                    quiz__class_target=class_level_int,
                    quiz__question_type__in=selected_types
                ).values('quiz__question_type').annotate(total=Count('id'))
            }

            next_type = pick_next_type(
                available_counts=available_static_counts,
                served_counts=served_static_counts,
                selected_types=selected_types
            )

            next_question = None
            if next_type:
                next_question = static_queryset.filter(question_type=next_type).order_by('created_at', 'id').first()
            
            if next_question:
                print(f"[AdaptiveQuiz] Returning static question ID: {next_question.id}")
                serializer = QuizSerializer(next_question)
                return Response({
                    'question': serializer.data,
                    'source': 'static',
                    'progress': {
                        'status': progress.status,
                        'completion_percentage': progress.static_completion_percentage,
                        'current_difficulty': progress.current_difficulty
                    },
                    'selected_question_types': selected_types,
                    'level_info': level_info,
                })
            else:
                # All static questions completed
                progress.status = 'finished'
                progress.static_questions_completed = progress.total_static_questions
                progress.static_completion_percentage = 100.0
                progress.update_progress()
                print(f"[AdaptiveQuiz] All static questions completed")
        
        # Check if AI generation should be triggered
        if progress.static_completion_percentage >= 90:
            print(f"[AdaptiveQuiz] 90% threshold reached, checking AI questions...")

            ai_unanswered_queryset = AIGeneratedQuestion.objects.filter(
                user=user,
                subject=subject,
                class_level=class_level_int,
                is_answered=False,
                question_type__in=selected_types
            )

            available_ai_counts = {
                row['question_type']: row['total']
                for row in ai_unanswered_queryset.values('question_type').annotate(total=Count('id'))
            }
            served_ai_counts = {
                row['question_type']: row['total']
                for row in AIGeneratedQuestion.objects.filter(
                    user=user,
                    subject=subject,
                    class_level=class_level_int,
                    is_answered=True,
                    question_type__in=selected_types
                ).values('question_type').annotate(total=Count('id'))
            }

            next_ai_type = pick_next_type(
                available_counts=available_ai_counts,
                served_counts=served_ai_counts,
                selected_types=selected_types
            )

            ai_question = None
            if next_ai_type:
                ai_question = ai_unanswered_queryset.filter(question_type=next_ai_type).order_by('generated_at').first()
            
            if ai_question:
                print(f"[AdaptiveQuiz] Returning AI question ID: {ai_question.id}")
                print(f"[AdaptiveQuiz] Question type: {ai_question.question_type}")
                print(f"[AdaptiveQuiz] Options: {ai_question.options}")
                
                # Ensure options is a proper dict for MCQ questions
                options = ai_question.options if ai_question.options else {}
                if ai_question.question_type == 'mcq' and not options:
                    print(f"[AdaptiveQuiz] WARNING: MCQ question has no options!")
                
                return Response({
                    'question': {
                        'id': ai_question.id,
                        'question_text': ai_question.question_text,
                        'question_type': ai_question.question_type,
                        'options': options,
                        'difficulty': ai_question.difficulty,
                        'subject': ai_question.subject,
                        'class_target': ai_question.class_level
                    },
                    'source': 'ai',
                    'progress': {
                        'status': progress.status,
                        'completion_percentage': progress.static_completion_percentage,
                        'current_difficulty': progress.current_difficulty,
                        'ai_questions_answered': progress.ai_questions_answered
                    },
                    'selected_question_types': selected_types,
                    'level_info': level_info,
                })
            else:
                # Generate new AI questions by selected type so users see all requested formats.
                print(f"[AdaptiveQuiz] No AI questions available, triggering generation by type...")
                from ai.question_generator import get_question_generator
                
                generator = get_question_generator()

                target_per_type = 2
                generation_targets = {
                    selected_type: max(0, target_per_type - available_ai_counts.get(selected_type, 0))
                    for selected_type in selected_types
                }
                generation_errors = []
                generated_count = 0

                for selected_type, needed_count in generation_targets.items():
                    if needed_count <= 0:
                        continue

                    success, new_questions, error = generator.generate_batch_questions(
                        user=user,
                        subject=subject,
                        class_level=class_level_int,
                        difficulty=generation_difficulty,
                        question_type=selected_type,
                        batch_size=needed_count
                    )

                    if not success:
                        generation_errors.append(f"{selected_type}: {error}")
                        continue

                    generated_count += len(new_questions)

                if generated_count > 0:
                    print(f"[AdaptiveQuiz] Generated {generated_count} new AI questions")

                    ai_unanswered_queryset = AIGeneratedQuestion.objects.filter(
                        user=user,
                        subject=subject,
                        class_level=class_level_int,
                        is_answered=False,
                        question_type__in=selected_types
                    )
                    available_ai_counts = {
                        row['question_type']: row['total']
                        for row in ai_unanswered_queryset.values('question_type').annotate(total=Count('id'))
                    }
                    next_ai_type = pick_next_type(
                        available_counts=available_ai_counts,
                        served_counts=served_ai_counts,
                        selected_types=selected_types
                    )

                    if next_ai_type:
                        ai_question = ai_unanswered_queryset.filter(question_type=next_ai_type).order_by('generated_at').first()

                    if ai_question:
                        print(f"[AdaptiveQuiz] Returning newly generated AI question ID: {ai_question.id}")
                        print(f"[AdaptiveQuiz] Question type: {ai_question.question_type}")
                        print(f"[AdaptiveQuiz] Options: {ai_question.options}")

                        options = ai_question.options if ai_question.options else {}
                        if ai_question.question_type == 'mcq' and not options:
                            print(f"[AdaptiveQuiz] WARNING: MCQ question has no options!")

                        return Response({
                            'question': {
                                'id': ai_question.id,
                                'question_text': ai_question.question_text,
                                'question_type': ai_question.question_type,
                                'options': options,
                                'difficulty': ai_question.difficulty,
                                'subject': ai_question.subject,
                                'class_target': ai_question.class_level
                            },
                            'source': 'ai',
                            'progress': {
                                'status': progress.status,
                                'completion_percentage': progress.static_completion_percentage,
                                'current_difficulty': progress.current_difficulty
                            },
                            'selected_question_types': selected_types,
                            'level_info': level_info,
                        })

                if generation_errors:
                    print(f"[AdaptiveQuiz] Failed to generate AI questions: {generation_errors}")
                    return Response(
                        {'error': f'Failed to generate AI questions: {" | ".join(generation_errors)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
        
        # No more questions available
        print(f"[AdaptiveQuiz] No more questions available")
        return Response({
            'message': 'Quiz completed! No more questions available.',
            'progress': {
                'status': progress.status,
                'completion_percentage': progress.static_completion_percentage,
                'ai_questions_answered': progress.ai_questions_answered,
                'ai_questions_correct': progress.ai_questions_correct
            },
            'selected_question_types': selected_types,
            'level_info': level_info,
        }, status=status.HTTP_200_OK)


class AdaptiveQuizSubmitAnswerView(APIView):
    """Submit answer for a question (static or AI)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        question_id = request.data.get('question_id')
        answer = request.data.get('answer')
        source = request.data.get('source')  # 'static' or 'ai'
        subject = request.data.get('subject')
        class_level = request.data.get('class_level', user.class_level)
        question_types = request.data.get(
            'question_types',
            request.data.get('question_type', 'mcq')
        )
        selected_types = parse_question_types(question_types)

        try:
            class_level_int = int(class_level)
        except (TypeError, ValueError):
            return Response(
                {'error': 'class_level must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not all([question_id, answer, source, subject]):
            return Response(
                {'error': 'question_id, answer, source, and subject are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"[AdaptiveQuiz] Submitting answer for {source} question ID: {question_id}")
        
        # Get progress
        progress, _ = UserQuizProgress.objects.get_or_create(
            user=user,
            subject=subject,
            class_level=class_level_int,
            defaults={'status': 'ai_active'}
        )

        level_info = get_level_info(
            user=user,
            subject=subject,
            class_level=class_level_int,
        )
        generation_difficulty = level_info['recommended_difficulty']

        if progress.current_difficulty != generation_difficulty:
            progress.current_difficulty = generation_difficulty
            progress.save(update_fields=['current_difficulty', 'last_activity'])
        
        is_correct = False
        correct_answer = ""
        explanation = ""
        
        if source == 'static':
            # Handle static question
            try:
                question = Quiz.objects.get(id=question_id)
                
                # CRITICAL: Check if user has already answered this question
                existing_attempt = QuizAttempt.objects.filter(
                    user=user,
                    quiz=question
                ).first()
                
                if existing_attempt:
                    print(f"[AdaptiveQuiz] User {user.username} already answered question {question_id}")
                    return Response({
                        'error': 'You have already answered this question',
                        'message': 'This question cannot be attempted again',
                        'already_answered': True,
                        'previous_attempt': {
                            'selected_answer': existing_attempt.selected_answer,
                            'is_correct': existing_attempt.is_correct,
                            'attempted_at': existing_attempt.attempted_at
                        }
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                is_correct = evaluate_quiz_answer(
                    question_type=question.question_type,
                    selected_answer=answer,
                    correct_answer=question.correct_answer,
                    raw_options=question.options,
                )
                correct_answer = question.correct_answer
                explanation = question.explanation
                
                # Save attempt
                QuizAttempt.objects.create(
                    user=user,
                    quiz=question,
                    selected_answer=answer,
                    is_correct=is_correct
                )
                
                # Update progress
                progress.static_questions_completed += 1
                progress.update_progress()
                
                # Award points
                if is_correct:
                    user.total_points += 10
                    user.save()
                
                print(f"[AdaptiveQuiz] Static question answered: {'Correct' if is_correct else 'Incorrect'}")
                
            except Quiz.DoesNotExist:
                return Response(
                    {'error': 'Question not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        elif source == 'ai':
            # Handle AI-generated question
            try:
                question = AIGeneratedQuestion.objects.get(id=question_id, user=user)
                
                # CRITICAL: Check if already answered
                if question.is_answered:
                    print(f"[AdaptiveQuiz] User {user.username} already answered AI question {question_id}")
                    return Response({
                        'error': 'You have already answered this question',
                        'message': 'This AI question cannot be attempted again',
                        'already_answered': True,
                        'previous_attempt': {
                            'selected_answer': question.user_answer,
                            'is_correct': question.is_correct,
                            'attempted_at': question.answered_at
                        }
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                is_correct = evaluate_quiz_answer(
                    question_type=question.question_type,
                    selected_answer=answer,
                    correct_answer=question.correct_answer,
                    raw_options=question.options,
                )
                correct_answer = question.correct_answer
                explanation = question.explanation
                
                # Update AI question
                question.is_answered = True
                question.user_answer = answer
                question.is_correct = is_correct
                question.answered_at = timezone.now()
                question.save()
                
                # Update progress
                progress.ai_questions_answered += 1
                if is_correct:
                    progress.ai_questions_correct += 1
                progress.save()
                
                # Award points
                if is_correct:
                    user.total_points += 15  # More points for AI questions
                    user.save()
                
                print(f"[AdaptiveQuiz] AI question answered: {'Correct' if is_correct else 'Incorrect'}")
                
                # Check if difficulty should be adjusted
                from ai.question_generator import get_question_generator
                generator = get_question_generator()
                generator.update_difficulty_based_on_performance(
                    user=user,
                    subject=subject,
                    class_level=class_level_int
                )

                # Replenish unanswered pool by selected types in the background.
                def replenish_ai_questions():
                    try:
                        unanswered_counts = {
                            row['question_type']: row['total']
                            for row in AIGeneratedQuestion.objects.filter(
                                user=user,
                                subject=subject,
                                class_level=class_level_int,
                                is_answered=False,
                                question_type__in=selected_types
                            ).values('question_type').annotate(total=Count('id'))
                        }

                        target_per_type = 2
                        for selected_type in selected_types:
                            needed_count = max(0, target_per_type - unanswered_counts.get(selected_type, 0))
                            if needed_count <= 0:
                                continue

                            generator.generate_batch_questions(
                                user=user,
                                subject=subject,
                                class_level=class_level_int,
                                difficulty=generation_difficulty,
                                question_type=selected_type,
                                batch_size=needed_count
                            )
                    except Exception as generation_error:
                        print(f"[AdaptiveQuiz] Background AI replenishment failed: {generation_error}")

                Thread(target=replenish_ai_questions, daemon=True).start()
                
            except AIGeneratedQuestion.DoesNotExist:
                return Response(
                    {'error': 'AI question not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {'error': 'Invalid source. Must be "static" or "ai"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'is_correct': is_correct,
            'correct_answer': correct_answer,
            'correct_answer_display': format_answer_for_display(
                question.question_type,
                correct_answer,
                question.options,
            ),
            'explanation': explanation,
            'selected_question_types': selected_types,
            'progress': {
                'status': progress.status,
                'static_completed': progress.static_questions_completed,
                'total_static': progress.total_static_questions,
                'completion_percentage': progress.static_completion_percentage,
                'current_difficulty': progress.current_difficulty,
                'ai_questions_answered': progress.ai_questions_answered,
                'ai_questions_correct': progress.ai_questions_correct
            },
            'level_info': get_level_info(
                user=user,
                subject=subject,
                class_level=class_level_int,
            ),
        })


class AdaptiveQuizProgressView(APIView):
    """Get current quiz progress"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        subject = request.query_params.get('subject')
        class_level = request.query_params.get('class_level', user.class_level)
        
        if not subject:
            return Response(
                {'error': 'Subject is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            class_level_int = int(class_level)
        except (TypeError, ValueError):
            return Response(
                {'error': 'class_level must be an integer'},
                status=status.HTTP_400_BAD_REQUEST
            )

        progress = UserQuizProgress.objects.filter(
            user=user,
            subject=subject,
            class_level=class_level_int
        ).first()
        
        if not progress:
            return Response({
                'exists': False,
                'message': 'No quiz progress found for this subject'
            })
        
        return Response({
            'exists': True,
            'progress': {
                'status': progress.status,
                'static_completed': progress.static_questions_completed,
                'total_static': progress.total_static_questions,
                'completion_percentage': progress.static_completion_percentage,
                'current_difficulty': progress.current_difficulty,
                'ai_questions_answered': progress.ai_questions_answered,
                'ai_questions_correct': progress.ai_questions_correct,
                'started_at': progress.started_at,
                'last_activity': progress.last_activity,
                'finished_at': progress.finished_at
            },
            'level_info': get_level_info(
                user=user,
                subject=subject,
                class_level=class_level_int,
            ),
        })
