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
            performance, created = UserPerformance.objects.get_or_create(
                user=user,
                subject=quiz.subject,
                defaults={'difficulty': 'easy'}
            )
            
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
