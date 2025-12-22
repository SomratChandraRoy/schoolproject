from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Quiz, QuizAttempt, Subject
from .serializers import QuizSerializer, QuizAttemptSerializer, SubjectSerializer


class IsAdminUser(permissions.BasePermission):
    """Custom permission to only allow admin users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_admin


class AdminQuizViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD operations for quizzes"""
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = Quiz.objects.all().order_by('-created_at')
        
        # Filter by subject
        subject = self.request.query_params.get('subject', None)
        if subject:
            queryset = queryset.filter(subject=subject)
        
        # Filter by class
        class_level = self.request.query_params.get('class_level', None)
        if class_level:
            queryset = queryset.filter(class_target=class_level)
        
        # Filter by difficulty
        difficulty = self.request.query_params.get('difficulty', None)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        # Search by question text
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(question_text__icontains=search)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get quiz statistics"""
        total_quizzes = Quiz.objects.count()
        by_difficulty = {
            'easy': Quiz.objects.filter(difficulty='easy').count(),
            'medium': Quiz.objects.filter(difficulty='medium').count(),
            'hard': Quiz.objects.filter(difficulty='hard').count(),
        }
        by_class = {}
        for i in range(6, 13):
            by_class[f'class_{i}'] = Quiz.objects.filter(class_target=i).count()
        
        return Response({
            'total_quizzes': total_quizzes,
            'by_difficulty': by_difficulty,
            'by_class': by_class
        })


class AdminQuizAttemptViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD operations for quiz attempts"""
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = QuizAttempt.objects.all().order_by('-attempted_at')
        
        # Filter by user
        user_id = self.request.query_params.get('user_id', None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by quiz
        quiz_id = self.request.query_params.get('quiz_id', None)
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        
        return queryset


class AdminSubjectViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD operations for subjects"""
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = Subject.objects.all().order_by('class_level', 'name')
        
        # Filter by class
        class_level = self.request.query_params.get('class_level', None)
        if class_level:
            queryset = queryset.filter(class_level=class_level)
        
        # Filter by stream
        stream = self.request.query_params.get('stream', None)
        if stream:
            queryset = queryset.filter(stream=stream)
        
        return queryset
