from django.urls import path
from .views import (
    QuizListCreateView, QuizDetailView, QuizAttemptView, 
    UserAnalyticsView, SubmitQuizResultsView, SubjectListView
)

urlpatterns = [
    path('', QuizListCreateView.as_view(), name='quiz-list-create'),
    path('<int:pk>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('attempt/', QuizAttemptView.as_view(), name='quiz-attempt'),
    path('analytics/', UserAnalyticsView.as_view(), name='user-analytics'),
    path('submit-results/', SubmitQuizResultsView.as_view(), name='submit-results'),
    path('subjects/', SubjectListView.as_view(), name='subject-list'),
]