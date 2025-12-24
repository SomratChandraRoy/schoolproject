"""
Adaptive Quiz Views
Handles adaptive quiz flow with static questions and AI-generated questions
"""
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Count, Q

from .models import Quiz, QuizAttempt, UserQuizProgress, AIGeneratedQuestion
from .serializers import QuizSerializer
from accounts.models import User


class AdaptiveQuizStartView(APIView):
    """Initialize or continue adaptive quiz session"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        subject = request.data.get('subject')
        class_level = request.data.get('class_level', user.class_level)
        question_type = request.data.get('question_type', 'mcq')
        
        if not subject or not class_level:
            return Response(
                {'error': 'Subject and class_level are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"[AdaptiveQuiz] Starting quiz for {user.username}: {subject}, Class {class_level}")
        
        # Get or create progress tracker
        progress, created = UserQuizProgress.objects.get_or_create(
            user=user,
            subject=subject,
            class_level=class_level
        )
        
        # Count total static questions for this subject/class
        if created or progress.total_static_questions == 0:
            total_static = Quiz.objects.filter(
                subject=subject,
                class_target=class_level
            ).count()
            progress.total_static_questions = total_static
            progress.save()
            print(f"[AdaptiveQuiz] Total static questions: {total_static}")
        
        # Update progress
        progress.update_progress()
        
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
            'message': 'Quiz session initialized'
        })


class AdaptiveQuizNextQuestionView(APIView):
    """Get the next question (static or AI-generated)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        subject = request.data.get('subject')
        class_level = request.data.get('class_level', user.class_level)
        question_type = request.data.get('question_type', 'mcq')
        
        if not subject or not class_level:
            return Response(
                {'error': 'Subject and class_level are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get progress
        progress = UserQuizProgress.objects.filter(
            user=user,
            subject=subject,
            class_level=class_level
        ).first()
        
        if not progress:
            return Response(
                {'error': 'Quiz session not initialized. Call /start first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"[AdaptiveQuiz] Getting next question for {user.username}")
        print(f"[AdaptiveQuiz] Progress status: {progress.status}, Completion: {progress.static_completion_percentage:.1f}%")
        
        # Determine question source based on progress
        if progress.status == 'static' or progress.static_completion_percentage < 90:
            # Get static question that user hasn't answered yet
            answered_ids = QuizAttempt.objects.filter(
                user=user,
                quiz__subject=subject,
                quiz__class_target=class_level
            ).values_list('quiz_id', flat=True)
            
            next_question = Quiz.objects.filter(
                subject=subject,
                class_target=class_level
            ).exclude(id__in=answered_ids).first()
            
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
                    }
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
            
            # Check for unanswered AI questions
            ai_question = AIGeneratedQuestion.objects.filter(
                user=user,
                subject=subject,
                class_level=class_level,
                is_answered=False
            ).order_by('generated_at').first()
            
            if ai_question:
                print(f"[AdaptiveQuiz] Returning AI question ID: {ai_question.id}")
                return Response({
                    'question': {
                        'id': ai_question.id,
                        'question_text': ai_question.question_text,
                        'question_type': ai_question.question_type,
                        'options': ai_question.options,
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
                    }
                })
            else:
                # Generate new AI questions
                print(f"[AdaptiveQuiz] No AI questions available, triggering generation...")
                from ai.question_generator import get_question_generator
                
                generator = get_question_generator()
                success, count, error = generator.check_and_generate_questions(
                    user=user,
                    subject=subject,
                    class_level=class_level,
                    difficulty=progress.current_difficulty,
                    question_type=question_type
                )
                
                if success and count > 0:
                    print(f"[AdaptiveQuiz] Generated {count} new AI questions")
                    # Get the first generated question
                    ai_question = AIGeneratedQuestion.objects.filter(
                        user=user,
                        subject=subject,
                        class_level=class_level,
                        is_answered=False
                    ).order_by('generated_at').first()
                    
                    if ai_question:
                        return Response({
                            'question': {
                                'id': ai_question.id,
                                'question_text': ai_question.question_text,
                                'question_type': ai_question.question_type,
                                'options': ai_question.options,
                                'difficulty': ai_question.difficulty,
                                'subject': ai_question.subject,
                                'class_target': ai_question.class_level
                            },
                            'source': 'ai',
                            'progress': {
                                'status': progress.status,
                                'completion_percentage': progress.static_completion_percentage,
                                'current_difficulty': progress.current_difficulty
                            }
                        })
                else:
                    print(f"[AdaptiveQuiz] Failed to generate AI questions: {error}")
                    return Response(
                        {'error': f'Failed to generate AI questions: {error}'},
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
            }
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
        
        if not all([question_id, answer, source, subject]):
            return Response(
                {'error': 'question_id, answer, source, and subject are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"[AdaptiveQuiz] Submitting answer for {source} question ID: {question_id}")
        
        # Get progress
        progress = UserQuizProgress.objects.filter(
            user=user,
            subject=subject,
            class_level=class_level
        ).first()
        
        if not progress:
            return Response(
                {'error': 'Quiz session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        is_correct = False
        correct_answer = ""
        explanation = ""
        
        if source == 'static':
            # Handle static question
            try:
                question = Quiz.objects.get(id=question_id)
                is_correct = (answer == question.correct_answer)
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
                is_correct = (answer == question.correct_answer)
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
                    class_level=class_level
                )
                
                # Trigger generation of more questions if needed
                generator.check_and_generate_questions(
                    user=user,
                    subject=subject,
                    class_level=class_level,
                    difficulty=progress.current_difficulty,
                    question_type=question.question_type
                )
                
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
            'explanation': explanation,
            'progress': {
                'status': progress.status,
                'static_completed': progress.static_questions_completed,
                'total_static': progress.total_static_questions,
                'completion_percentage': progress.static_completion_percentage,
                'current_difficulty': progress.current_difficulty,
                'ai_questions_answered': progress.ai_questions_answered,
                'ai_questions_correct': progress.ai_questions_correct
            }
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
        
        progress = UserQuizProgress.objects.filter(
            user=user,
            subject=subject,
            class_level=class_level
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
            }
        })
