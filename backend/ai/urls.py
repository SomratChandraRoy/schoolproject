from django.urls import path
from .views import StartAIChatSessionView, AIChatMessageView, GetChatHistoryView, SaveOfflineNoteView, ListOfflineNotesView, RemedialLearningView, GenerateQuizQuestionView, ManageClassQuestionsView

urlpatterns = [
    path('chat/start/', StartAIChatSessionView.as_view(), name='start-chat-session'),
    path('chat/message/', AIChatMessageView.as_view(), name='ai-chat-message'),
    path('chat/history/<str:session_id>/', GetChatHistoryView.as_view(), name='chat-history'),
    path('notes/save/', SaveOfflineNoteView.as_view(), name='save-offline-note'),
    path('notes/list/', ListOfflineNotesView.as_view(), name='list-offline-notes'),
    path('remedial/', RemedialLearningView.as_view(), name='remedial-learning'),
    path('generate-question/', GenerateQuizQuestionView.as_view(), name='generate-quiz-question'),
    path('manage-questions/<int:class_level>/<str:subject>/', ManageClassQuestionsView.as_view(), name='manage-class-questions'),
    path('manage-questions/<int:class_level>/<str:subject>/<int:question_id>/', ManageClassQuestionsView.as_view(), name='delete-class-question'),
]