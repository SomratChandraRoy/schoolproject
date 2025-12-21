from django.urls import path
from .views import (
    StartAIChatSessionView, AIChatMessageView, GetChatHistoryView, 
    SaveOfflineNoteView, ListOfflineNotesView, RemedialLearningView, 
    GenerateQuizQuestionView, ManageClassQuestionsView,
    GenerateStudyNotesView, GenerateBookSummaryView, GenerateGameHintView,
    AnalyzeStudyPatternView, GenerateSyllabusBreakdownView, ImprovedRemedialLearningView
)

urlpatterns = [
    # Chat endpoints
    path('chat/start/', StartAIChatSessionView.as_view(), name='start-chat-session'),
    path('chat/message/', AIChatMessageView.as_view(), name='ai-chat-message'),
    path('chat/history/<str:session_id>/', GetChatHistoryView.as_view(), name='chat-history'),
    
    # Notes endpoints
    path('notes/save/', SaveOfflineNoteView.as_view(), name='save-offline-note'),
    path('notes/list/', ListOfflineNotesView.as_view(), name='list-offline-notes'),
    path('notes/generate/', GenerateStudyNotesView.as_view(), name='generate-study-notes'),
    
    # Remedial learning
    path('remedial/', RemedialLearningView.as_view(), name='remedial-learning'),
    path('remedial/improved/', ImprovedRemedialLearningView.as_view(), name='improved-remedial-learning'),
    
    # Question generation (Teachers/Admins only)
    path('generate-question/', GenerateQuizQuestionView.as_view(), name='generate-quiz-question'),
    path('manage-questions/<int:class_level>/<str:subject>/', ManageClassQuestionsView.as_view(), name='manage-class-questions'),
    path('manage-questions/<int:class_level>/<str:subject>/<int:question_id>/', ManageClassQuestionsView.as_view(), name='delete-class-question'),
    
    # Book and syllabus AI features
    path('book/summary/', GenerateBookSummaryView.as_view(), name='generate-book-summary'),
    path('syllabus/breakdown/', GenerateSyllabusBreakdownView.as_view(), name='generate-syllabus-breakdown'),
    
    # Game AI features
    path('game/hint/', GenerateGameHintView.as_view(), name='generate-game-hint'),
    
    # Study analytics
    path('study/analyze/', AnalyzeStudyPatternView.as_view(), name='analyze-study-pattern'),
]