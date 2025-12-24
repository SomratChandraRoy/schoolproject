from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Quiz, QuizAttempt, Analytics, UserPerformance, Subject
from .serializers import QuizSerializer, QuizAttemptSerializer, AnalyticsSerializer, SubjectSerializer
from accounts.models import User
from accounts.permissions import IsTeacher, IsTeacherOrAdmin


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
        """Override list to add fallback AI generation when no questions available"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get query parameters for fallback
        subject = request.query_params.get('subject')
        class_level = request.query_params.get('class_level')
        question_types = request.query_params.get('question_types', 'mcq')
        
        print(f"[QuizList] Filtering: subject={subject}, class={class_level}, types={question_types}")
        print(f"[QuizList] Initial queryset count: {queryset.count()}")
        
        # Parse question types
        types_list = [t.strip() for t in question_types.split(',')]
        
        # Validate MCQ questions have proper options (only if MCQ is in the selected types)
        if 'mcq' in types_list:
            valid_mcq_ids = []
            invalid_mcq_ids = []
            
            for q in queryset.filter(question_type='mcq'):
                # Check if options is a valid dict with keys
                if isinstance(q.options, dict) and len(q.options) >= 2:
                    valid_mcq_ids.append(q.id)
                else:
                    invalid_mcq_ids.append(q.id)
            
            print(f"[QuizList] MCQ validation: {len(valid_mcq_ids)} valid, {len(invalid_mcq_ids)} invalid")
            
            # Remove invalid MCQ questions
            if invalid_mcq_ids:
                queryset = queryset.exclude(id__in=invalid_mcq_ids)
        
        # Now filter by question types (this was already done in get_queryset, but let's be explicit)
        queryset = queryset.filter(question_type__in=types_list)
        
        print(f"[QuizList] After filtering by types {types_list}: {queryset.count()} questions")
        
        # Check if we have enough questions (threshold: 5)
        question_count = queryset.count()
        
        if question_count < 5 and subject and class_level:
            print(f"[QuizList] Only {question_count} questions found, triggering AI generation...")
            
            # Use fallback AI generation
            from ai.question_generator import get_question_generator
            
            generator = get_question_generator()
            primary_type = types_list[0]  # Use first selected type
            
            # Generate more questions to reach at least 10 total
            questions_needed = max(10 - question_count, 5)
            
            print(f"[QuizList] Generating {questions_needed} AI questions of type '{primary_type}'...")
            
            success, ai_questions, error = generator.generate_batch_questions(
                user=request.user,
                subject=subject,
                class_level=int(class_level),
                difficulty='medium',
                question_type=primary_type,
                batch_size=questions_needed
            )
            
            if success:
                print(f"[QuizList] Successfully generated {len(ai_questions)} AI questions")
                
                # Convert AIGeneratedQuestion to response format
                ai_data = []
                for q in ai_questions:
                    ai_data.append({
                        'id': f'ai_{q.id}',  # Prefix with 'ai_' to distinguish
                        'subject': q.subject,
                        'class_target': q.class_level,
                        'difficulty': q.difficulty,
                        'question_text': q.question_text,
                        'question_type': q.question_type,
                        'options': q.options,
                        'correct_answer': q.correct_answer,
                        'explanation': q.explanation
                    })
                
                # Combine database questions with AI questions
                page = self.paginate_queryset(queryset)
                if page is not None:
                    serializer = self.get_serializer(page, many=True)
                    db_data = serializer.data
                else:
                    serializer = self.get_serializer(queryset, many=True)
                    db_data = serializer.data
                
                combined_data = db_data + ai_data
                
                print(f"[QuizList] Returning {len(combined_data)} total questions ({len(db_data)} DB + {len(ai_data)} AI)")
                
                return Response({
                    'count': len(combined_data),
                    'next': None,
                    'previous': None,
                    'results': combined_data,
                    'source': 'mixed' if db_data else 'ai_generated',
                    'message': f'AI generated {len(ai_data)} questions' if ai_data else None
                })
            else:
                print(f"[QuizList] AI generation failed: {error}")
                # Continue with database questions only
        
        # Standard pagination response
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
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
            
            # Check if answer is correct
            is_correct = selected_answer == quiz.correct_answer
            
            # Save attempt
            attempt = QuizAttempt.objects.create(
                user=user,
                quiz=quiz,
                selected_answer=selected_answer,
                is_correct=is_correct
            )
            
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
            
            return Response({
                'attempt': QuizAttemptSerializer(attempt).data,
                'is_correct': is_correct,
                'correct_answer': quiz.correct_answer,
                'explanation': quiz.explanation,
                'user_performance': {
                    'elo_rating': performance.elo_rating,
                    'difficulty': performance.difficulty
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
        class_level = request.query_params.get('class_level', user.class_level)
        
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
