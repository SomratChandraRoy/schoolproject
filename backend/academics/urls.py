from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SubjectViewSet, SyllabusTopicViewSet, StudyPlanViewSet, FlashcardDeckViewSet, FlashcardDeckViewSet

router = DefaultRouter()
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'topics', SyllabusTopicViewSet, basename='topic')
router.register(r'study-plans', StudyPlanViewSet, basename='study-plan')

urlpatterns = [
    path('', include(router.urls)),
]
