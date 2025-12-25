from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ChatRoomViewSet, MessageViewSet, TypingStatusViewSet, MemberListView,
    get_total_unread_count, upload_file
)

router = DefaultRouter()
router.register(r'members', MemberListView, basename='member')
router.register(r'chatrooms', ChatRoomViewSet, basename='chatroom')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'typing', TypingStatusViewSet, basename='typing')

urlpatterns = [
    path('', include(router.urls)),
    path('unread-count/', get_total_unread_count, name='unread-count'),
    path('upload-file/', upload_file, name='upload-file'),
]
