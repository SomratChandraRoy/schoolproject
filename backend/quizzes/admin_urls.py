from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import AdminQuizViewSet, AdminQuizAttemptViewSet, AdminSubjectViewSet

router = DefaultRouter()
router.register(r'quizzes', AdminQuizViewSet, basename='admin-quizzes')
router.register(r'quiz-attempts', AdminQuizAttemptViewSet, basename='admin-quiz-attempts')
router.register(r'subjects', AdminSubjectViewSet, basename='admin-subjects')

urlpatterns = [
    path('', include(router.urls)),
]
