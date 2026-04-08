from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Quiz, QuizAttempt, Analytics, UserPerformance, Subject
from .serializers import QuizSerializer, QuizAttemptSerializer, AnalyticsSerializer, SubjectSerializer
from accounts.models import User
from accounts.permissions import IsTeacher, IsTeacherOrAdmin
from threading import Thread


class QuizListCreateView(generics.ListCreateAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Quiz.objects.all()
        
        # Get query parameters
        subject = self.request.query_params.get('subject', None)
        difficulty = self.request.query_params.get('difficulty', None)
        class_level = self.request.query_params.get('class_level', None)
        question_types = self.request.query_params.get('question_types', None)
        
        # Filter by subject if provided
        if subject:
            queryset = queryset.filter(subject=subject)
            
        # Filter by class level if provided
        if class_level:
            queryset = queryset.filter(class_target=class_level)
        
        # Filter by question types if provided (comma-separated: mcq,short,long)
        if question_types:
            types_list = [t.strip() for t in question_types.split(',')]
            queryset = queryset.filter(question_type__in=types_list)
        
        # DON'T filter by difficulty - all questions are medium level
        # This ensures students always get questions regardless of difficulty selection
        # if difficulty:
        #     queryset = queryset.filter(difficulty=difficulty)
        
        # For quiz management page, teachers/admins should see ALL questions
        # Don't apply default class filter for teachers/admins
        # Students will still get filtered by their class in the quiz selection page
        
        return queryset.order_by('-created_at')  # Show newest first
    
    def list(self, request, *args, **kwargs):
        """Fast quiz loading with lightweight filtering and Groq-first generation."""
        base_queryset = self.filter_queryset(self.get_queryset())
        user = request.user

        # Get query parameters for fallback
        subject = request.query_params.get('subject')
        class_level = request.query_params.get('class_level')
        question_types = request.query_params.get('question_types', 'mcq')

        # Parse question types
        types_list = [t.strip() for t in question_types.split(',')]

        answered_question_ids = QuizAttempt.objects.filter(
            user=user
        ).values_list('quiz_id', flat=True)

        queryset = base_queryset.exclude(id__in=answered_question_ids).filter(question_type__in=types_list)

        # Lightweight option validity guard for MCQ without Python-loop validation on all rows.
        if 'mcq' in types_list:
            queryset = queryset.exclude(question_type='mcq', options={})

        # Return quickly with a bounded result set.
        fast_queryset = queryset.order_by('-created_at')[:20]
        if fast_queryset:
            serializer = self.get_serializer(fast_queryset, many=True)

            # If inventory is low, pre-generate in background for next request.
            if subject and class_level and len(serializer.data) < 5:
                def generate_in_background():
                    try:
                        from ai.question_generator import get_question_generator
                        generator = get_question_generator()
                        generator.generate_batch_questions(
                            user=request.user,
                            subject=subject,
                            class_level=int(class_level),
                            difficulty='medium',
                            question_type=types_list[0],
                            batch_size=6,
                            timeout_seconds=20,
                            groq_only=True
                        )
                    except Exception as bg_error:
                        print(f"[QuizList] Background generation failed: {bg_error}")

                Thread(target=generate_in_background, daemon=True).start()

            return Response({
                'count': len(serializer.data),
                'next': None,
                'previous': None,
                'results': serializer.data,
                'source': 'database'
            })

        # If static DB is empty, serve already generated AI questions for this user instantly.
        if subject and class_level:
            from .models import AIGeneratedQuestion

            ai_questions = AIGeneratedQuestion.objects.filter(
                user=request.user,
                subject=subject,
                class_level=int(class_level),
                is_answered=False,
                question_type__in=types_list
            ).order_by('generated_at')[:20]

            if ai_questions:
                ai_data = []
                for q in ai_questions:
                    ai_data.append({
                        'id': f'ai_{q.id}',
                        'subject': q.subject,
                        'class_target': q.class_level,
                        'difficulty': q.difficulty,
                        'question_text': q.question_text,
                        'question_type': q.question_type,
                        'options': q.options,
                        'correct_answer': q.correct_answer,
                        'explanation': q.explanation
                    })

                return Response({
                    'count': len(ai_data),
                    'next': None,
                    'previous': None,
                    'results': ai_data,
                    'source': 'ai_generated_groq'
                })

        # No DB questions left: start Groq generation in background and return fast.
        if subject and class_level:
            def generate_in_background_when_empty():
                try:
                    from ai.question_generator import get_question_generator
                    generator = get_question_generator()
                    generator.generate_batch_questions(
                        user=request.user,
                        subject=subject,
                        class_level=int(class_level),
                        difficulty='medium',
                        question_type=types_list[0],
                        batch_size=8,
                        timeout_seconds=20,
                        groq_only=True
                    )
                except Exception as bg_error:
                    print(f"[QuizList] Empty-case background generation failed: {bg_error}")

            Thread(target=generate_in_background_when_empty, daemon=True).start()

            return Response({
                'count': 0,
                'next': None,
                'previous': None,
                'results': [],
                'source': 'generation_started',
                'message': 'Generating quiz questions with Groq. Please retry shortly.'
            })

        return Response({
            'count': 0,
            'next': None,
            'previous': None,
            'results': [],
            'source': 'empty',
            'message': 'No quiz questions available yet. Please retry shortly.'
        })
    
    def perform_create(self, serializer):
        # Only teachers and admins can create quizzes
        if self.request.user.is_teacher or self.request.user.is_admin:
            serializer.save()
        else:
            raise permissions.PermissionDenied("Only teachers and admins can create quizzes.")


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    
    def perform_update(self, serializer):
        # Only teachers and admins can update quizzes
        if self.request.user.is_teacher or self.request.user.is_admin:
            serializer.save()
        else:
            raise permissions.PermissionDenied("Only teachers and admins can update quizzes.")
    
    def perform_destroy(self, instance):
        # Only teachers and admins can delete quizzes
        if self.request.user.is_teacher or self.request.user.is_admin:
            instance.delete()
        else:
            raise permissions.PermissionDenied("Only teachers and admins can delete quizzes.")


class QuizAttemptView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        quiz_id = request.data.get('quiz_id')
        selected_answer = request.data.get('selected_answer')
        
        try:
            quiz = Quiz.objects.get(id=quiz_id)
            
            # CRITICAL: Check if user has already answered this question
            existing_attempt = QuizAttempt.objects.filter(
                user=user,
                quiz=quiz
            ).first()
            
            if existing_attempt:
                print(f"[QuizAttempt] User {user.username} already answered question {quiz_id}")
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
            
            # Check if answer is correct
            is_correct = selected_answer == quiz.correct_answer
            
            # Save attempt
            attempt = QuizAttempt.objects.create(
                user=user,
                quiz=quiz,
                selected_answer=selected_answer,
                is_correct=is_correct
            )
            
            print(f"[QuizAttempt] User {user.username} answered question {quiz_id}: {'Correct' if is_correct else 'Incorrect'}")
            
            # Update user points
            if is_correct:
                user.total_points += 10
                user.save()
            
            # Update user performance tracking
            # Handle potential duplicates by using filter().first()
            try:
                performance, created = UserPerformance.objects.get_or_create(
                    user=user,
                    subject=quiz.subject,
                    defaults={'difficulty': 'easy'}
                )
            except UserPerformance.MultipleObjectsReturned:
                # If duplicates exist, use the most recent one and delete others
                performances = UserPerformance.objects.filter(
                    user=user,
                    subject=quiz.subject
                ).order_by('-last_updated')
                
                performance = performances.first()
                created = False
                
                # Delete duplicates (keep the first one)
                duplicate_ids = [p.id for p in performances[1:]]
                if duplicate_ids:
                    UserPerformance.objects.filter(id__in=duplicate_ids).delete()
                    print(f"[QuizAttempt] Cleaned up {len(duplicate_ids)} duplicate UserPerformance records")
            
            # Update performance stats
            performance.total_attempts += 1
            if is_correct:
                performance.correct_attempts += 1
            
            # Update Elo rating (assuming 100% for correct, 0% for incorrect)
            score_percentage = 100 if is_correct else 0
            performance.update_rating(score_percentage)
            
            # Update difficulty level based on performance
            performance.update_difficulty()
            performance.save()
            
            # Track progress for adaptive quiz system
            from .models import UserQuizProgress
            progress, _ = UserQuizProgress.objects.get_or_create(
                user=user,
                subject=quiz.subject,
                class_level=quiz.class_target
            )
            
            # Update static questions completed
            progress.static_questions_completed += 1
            
            # Count total static questions if not set
            if progress.total_static_questions == 0:
                progress.total_static_questions = Quiz.objects.filter(
                    subject=quiz.subject,
                    class_target=quiz.class_target
                ).count()
            
            progress.update_progress()
            
            # Calculate completion percentage
            completion_percentage = progress.static_completion_percentage
            
            # Trigger background AI generation at 50% completion
            if completion_percentage >= 50 and completion_percentage < 100:
                print(f"[QuizAttempt] 50% threshold reached ({completion_percentage:.1f}%), triggering background AI generation")
                
                # Start background generation (non-blocking)
                from threading import Thread
                from ai.question_generator import get_question_generator
                
                def generate_in_background():
                    try:
                        generator = get_question_generator()
                        generator.check_and_generate_questions(
                            user=user,
                            subject=quiz.subject,
                            class_level=quiz.class_target,
                            difficulty=progress.current_difficulty,
                            question_type=quiz.question_type
                        )
                        print(f"[QuizAttempt] Background AI generation completed")
                    except Exception as e:
                        print(f"[QuizAttempt] Background generation error: {str(e)}")
                
                thread = Thread(target=generate_in_background, daemon=True)
                thread.start()
            
            # Check if all static questions completed
            all_static_completed = completion_percentage >= 100
            
            # Update user's static_question_status if all completed
            if all_static_completed and user.static_question_status != 'finished':
                user.static_question_status = 'finished'
                user.save()
                print(f"[QuizAttempt] User {user.username} completed all static questions for {quiz.subject}")
            
            return Response({
                'attempt': QuizAttemptSerializer(attempt).data,
                'is_correct': is_correct,
                'correct_answer': quiz.correct_answer,
                'explanation': quiz.explanation,
                'user_performance': {
                    'elo_rating': performance.elo_rating,
                    'difficulty': performance.difficulty
                },
                'quiz_progress': {
                    'static_completed': progress.static_questions_completed,
                    'total_static': progress.total_static_questions,
                    'completion_percentage': completion_percentage,
                    'all_static_completed': all_static_completed,
                    'status': progress.status
                }
            }, status=status.HTTP_201_CREATED)
            
        except Quiz.DoesNotExist:
            return Response({'error': 'Quiz not found'}, status=status.HTTP_404_NOT_FOUND)


class UserAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        analytics = Analytics.objects.filter(user=user).order_by('-timestamp')
        serializer = AnalyticsSerializer(analytics, many=True)
        return Response(serializer.data)


class SubmitQuizResultsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        score = request.data.get('score')
        mistakes = request.data.get('mistakes', {})
        
        # Save analytics
        analytics = Analytics.objects.create(
            user=user,
            score=score,
            mistakes=mistakes
        )
        
        # Update user points based on score
        user.total_points += score
        user.save()
        
        serializer = AnalyticsSerializer(analytics)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SubjectListView(APIView):
    """Get subjects filtered by user's class level"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        requested_class_level = request.query_params.get('class_level')

        # Students can only access their own class subjects.
        if not (user.is_admin or user.is_teacher):
            class_level = user.class_level
        else:
            class_level = requested_class_level or user.class_level
        
        if not class_level:
            return Response(
                {'error': 'Class level not found. Please complete your profile.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all subjects for the user's class
        subjects = Subject.objects.filter(class_level=class_level)
        serializer = SubjectSerializer(subjects, many=True)
        
        return Response({
            'class_level': class_level,
            'subjects': serializer.data
        })


class ContinueWithAIQuestionsView(APIView):
    """Continue quiz with AI-generated questions after completing static questions"""
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
        
        print(f"[ContinueAI] User {user.username} continuing with AI questions for {subject}")
        
        # Get progress
        from .models import UserQuizProgress, AIGeneratedQuestion
        progress, _ = UserQuizProgress.objects.get_or_create(
            user=user,
            subject=subject,
            class_level=class_level
        )
        
        # Verify user has completed static questions
        if progress.static_completion_percentage < 100:
            return Response(
                {
                    'error': 'You must complete all static questions first',
                    'completion_percentage': progress.static_completion_percentage
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user's static_question_status to finished
        if user.static_question_status != 'finished':
            user.static_question_status = 'finished'
            user.save()
            print(f"[ContinueAI] Updated user status to 'finished'")
        
        # Update progress status
        if progress.status != 'ai_active':
            progress.status = 'ai_active'
            progress.save()
        
        # Check for existing AI questions
        # CRITICAL: Only get unanswered AI questions
        ai_questions = AIGeneratedQuestion.objects.filter(
            user=user,
            subject=subject,
            class_level=class_level,
            is_answered=False  # Only unanswered questions
        ).order_by('generated_at')
        
        ai_count = ai_questions.count()
        print(f"[ContinueAI] Found {ai_count} unanswered AI questions")
        
        # Generate more if needed
        if ai_count < 6:
            print(f"[ContinueAI] Generating more AI questions...")
            from ai.question_generator import get_question_generator
            
            generator = get_question_generator()
            questions_needed = 6 - ai_count
            
            success, new_questions, error = generator.generate_batch_questions(
                user=user,
                subject=subject,
                class_level=class_level,
                difficulty=progress.current_difficulty,
                question_type=question_type,
                batch_size=questions_needed
            )
            
            if success:
                print(f"[ContinueAI] Generated {len(new_questions)} new AI questions")
                
                # Save AI questions to main Quiz database for persistence
                # But DON'T save if user has already answered a similar question
                saved_count = 0
                for ai_q in new_questions:
                    # Check if already exists in Quiz table
                    existing = Quiz.objects.filter(
                        subject=ai_q.subject,
                        class_target=ai_q.class_level,
                        question_text=ai_q.question_text
                    ).first()
                    
                    if not existing:
                        new_quiz = Quiz.objects.create(
                            subject=ai_q.subject,
                            class_target=ai_q.class_level,
                            difficulty=ai_q.difficulty,
                            question_text=ai_q.question_text,
                            question_type=ai_q.question_type,
                            options=ai_q.options,
                            correct_answer=ai_q.correct_answer,
                            explanation=ai_q.explanation
                        )
                        
                        # Check if user has already answered this question
                        already_answered = QuizAttempt.objects.filter(
                            user=user,
                            quiz=new_quiz
                        ).exists()
                        
                        if already_answered:
                            # User already answered this, delete it
                            new_quiz.delete()
                            print(f"[ContinueAI] Skipped duplicate answered question")
                        else:
                            saved_count += 1
                
                print(f"[ContinueAI] Saved {saved_count} AI questions to database")
            else:
                print(f"[ContinueAI] Failed to generate AI questions: {error}")
                return Response(
                    {'error': f'Failed to generate AI questions: {error}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Get all unanswered AI questions (including newly generated)
        ai_questions = AIGeneratedQuestion.objects.filter(
            user=user,
            subject=subject,
            class_level=class_level,
            is_answered=False
        ).order_by('generated_at')
        
        # Convert to response format
        questions_data = []
        for q in ai_questions:
            questions_data.append({
                'id': f'ai_{q.id}',
                'question_text': q.question_text,
                'question_type': q.question_type,
                'options': q.options,
                'difficulty': q.difficulty,
                'subject': q.subject,
                'class_target': q.class_level,
                'source': 'ai'
            })
        
        return Response({
            'message': 'AI questions ready',
            'questions': questions_data,
            'count': len(questions_data),
            'progress': {
                'status': progress.status,
                'static_completed': progress.static_questions_completed,
                'total_static': progress.total_static_questions,
                'completion_percentage': progress.static_completion_percentage,
                'current_difficulty': progress.current_difficulty,
                'ai_questions_answered': progress.ai_questions_answered,
                'ai_questions_correct': progress.ai_questions_correct
            },
            'user_status': user.static_question_status
        }, status=status.HTTP_200_OK)
