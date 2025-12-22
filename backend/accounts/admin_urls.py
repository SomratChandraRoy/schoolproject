from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import AdminUserViewSet, AdminStudySessionViewSet, AdminNoteViewSet

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(r'study-sessions', AdminStudySessionViewSet, basename='admin-study-sessions')
router.register(r'notes', AdminNoteViewSet, basename='admin-notes')

urlpatterns = [
    path('', include(router.urls)),
]
