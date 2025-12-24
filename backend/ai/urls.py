from django.urls import path
from .views import (
    StartAIChatSessionView, AIChatMessageView, GetChatHistoryView, 
    SaveOfflineNoteView, ListOfflineNotesView, RemedialLearningView, 
    GenerateQuizQuestionView, ManageClassQuestionsView,
    GenerateStudyNotesView, GenerateBookSummaryView, GenerateGameHintView,
    AnalyzeStudyPatternView, GenerateSyllabusBreakdownView, ImprovedRemedialLearningView,
    AnalyzeQuizResultsView, GeneratePersonalizedLearningView
)
from .pdf_chat_views import AnalyzePDFView, ChatWithPDFView, ClearPDFCacheView
from .admin_views import AIProviderSettingsView, TestAIProviderView

urlpatterns = [
    # Admin endpoints (NEW)
    path('admin/provider-settings/', AIProviderSettingsView.as_view(), name='ai-provider-settings'),
    path('admin/test-provider/', TestAIProviderView.as_view(), name='test-ai-provider'),
    
    # Chat endpoints
    path('chat/start/', StartAIChatSessionView.as_view(), name='start-chat-session'),
    path('chat/message/', AIChatMessageView.as_view(), name='ai-chat-message'),
    path('chat/history/<str:session_id>/', GetChatHistoryView.as_view(), name='chat-history'),
    
    # PDF Chat endpoints (NEW)
    path('analyze-pdf/', AnalyzePDFView.as_view(), name='analyze-pdf'),
    path('chat-with-pdf/', ChatWithPDFView.as_view(), name='chat-with-pdf'),
    path('clear-pdf-cache/', ClearPDFCacheView.as_view(), name='clear-pdf-cache'),
    
    # Notes endpoints
    path('notes/save/', SaveOfflineNoteView.as_view(), name='save-offline-note'),
    path('notes/list/', ListOfflineNotesView.as_view(), name='list-offline-notes'),
    path('notes/generate/', GenerateStudyNotesView.as_view(), name='generate-study-notes'),
    
    # Remedial learning
    path('remedial/', RemedialLearningView.as_view(), name='remedial-learning'),
    path('remedial/improved/', ImprovedRemedialLearningView.as_view(), name='improved-remedial-learning'),
    
    # Quiz AI analysis (NEW)
    path('quiz/analyze/', AnalyzeQuizResultsView.as_view(), name='analyze-quiz-results'),
    path('quiz/learn/', GeneratePersonalizedLearningView.as_view(), name='generate-personalized-learning'),
    
    # Question generation (Teachers/Admins only)
    path('generate-question/', GenerateQuizQuestionView.as_view(), name='generate-quiz-question'),
    path('generate-quiz/', GenerateQuizQuestionView.as_view(), name='generate-quiz'),  # Alias for frontend compatibility
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