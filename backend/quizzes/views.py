from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Quiz, QuizAttempt, Analytics, UserPerformance
from .serializers import QuizSerializer, QuizAttemptSerializer, AnalyticsSerializer
from accounts.models import User
from accounts.permissions import IsTeacher, IsTeacherOrAdmin


class QuizListCreateView(generics.ListCreateAPIView):
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Quiz.objects.all()
        
        # Filter quizzes by user's class level
        if user.class_level:
            queryset = queryset.filter(class_target=user.class_level)
        
        # Filter quizzes by user's performance difficulty level
        # We'll get the highest difficulty the user has achieved in each subject
        filtered_queryset = Quiz.objects.none()
        
        # Get distinct subjects from the queryset
        subjects = queryset.values_list('subject', flat=True).distinct()
        
        for subject in subjects:
            # Get the user's performance for this subject
            try:
                performance = UserPerformance.objects.get(user=user, subject=subject)
                # Filter quizzes for this subject at the user's current difficulty level
                subject_quizzes = queryset.filter(subject=subject, difficulty=performance.difficulty)
                filtered_queryset = filtered_queryset.union(subject_quizzes)
            except UserPerformance.DoesNotExist:
                # If no performance data for this subject, show easy difficulty quizzes
                subject_quizzes = queryset.filter(subject=subject, difficulty='easy')
                filtered_queryset = filtered_queryset.union(subject_quizzes)
        
        return filtered_queryset if filtered_queryset.exists() else queryset
    
    def perform_create(self, serializer):
        # Only teachers can create quizzes
        if self.request.user.is_teacher:
            serializer.save()
        else:
            raise permissions.PermissionDenied("Only teachers can create quizzes.")


class QuizDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated, IsTeacherOrAdmin]
    
    def perform_update(self, serializer):
        # Only teachers can update quizzes
        if self.request.user.is_teacher:
            serializer.save()
        else:
            raise permissions.PermissionDenied("Only teachers can update quizzes.")
    
    def perform_destroy(self, instance):
        # Only teachers can delete quizzes
        if self.request.user.is_teacher:
            instance.delete()
        else:
            raise permissions.PermissionDenied("Only teachers can delete quizzes.")


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