from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubjectViewSet, SyllabusTopicViewSet, StudyPlanViewSet, FlashcardDeckViewSet

router = DefaultRouter()
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'topics', SyllabusTopicViewSet, basename='topic')
router.register(r'study-plans', StudyPlanViewSet, basename='study-plan')
router.register(r'flashcards', FlashcardDeckViewSet, basename='flashcard-deck')

urlpatterns = [
    path('', include(router.urls)),
]
